const db = require('../../config/db');
const { ResponseError } = require('../../utils/response');

exports.createRiwayat = async (userId, data) => {
    try {
        const { alamat, keluhan } = data || {};

        const hasKeluhan = keluhan && String(keluhan).trim().length > 0;
        const hasAlamat = alamat && String(alamat).trim().length > 0;

        if (!hasKeluhan && !hasAlamat) {
            throw new ResponseError(400, 'Keluhan dan alamat wajib diisi');
        }
        if (!hasKeluhan) {
            throw new ResponseError(400, 'Keluhan wajib diisi');
        }
        if (!hasAlamat) {
            throw new ResponseError(400, 'Alamat wajib diisi');
        }

        // Simpan ke DB (trim input sebelum simpan)
        const [result] = await db.query(
            'INSERT INTO riwayat_pasien (pasien_id, keluhan, alamat) VALUES (?, ?, ?)',
            [userId, String(keluhan).trim(), String(alamat).trim()]
        );

        return {
            id: result.insertId,
            user_id: userId,
            alamat: String(alamat).trim(),
            keluhan: String(keluhan).trim(),
        };
    } catch (err) {
        // Jika sudah ResponseError, lempar lagi agar controller bisa tangani sesuai status
        if (err instanceof ResponseError) throw err;

        // Error lain -> bungkus jadi ResponseError 500
        throw new ResponseError(500, 'Gagal menyimpan riwayat: ' + (err.message || 'Internal server error'));
    }
};

exports.getAllRiwayat = async (userId, limit, offset, search = '') => {
    try {
        const keyword = `%${search || ''}%`;

        // Query untuk menghitung total riwayat pasien
        const [[{ count }]] = await db.query(`
            SELECT COUNT(riwayat_pasien.id) as count 
            FROM riwayat_pasien 
            LEFT JOIN pasiens ON riwayat_pasien.pasien_id = pasiens.user_id
            LEFT JOIN catatan_feedback ON catatan_feedback.riwayat_id = riwayat_pasien.id
            WHERE pasiens.user_id = ?
        `, [userId]);

        // Jika tidak ada data
        if (count === 0) {
            throw new ResponseError(404, 'Riwayat pasien tidak ditemukan');
        }

        // Query untuk mengambil riwayat pasien dengan pagination
        const [result] = await db.query(`
            SELECT 
                rp.id AS riwayat_id, 
                rp.keluhan,
                rp.alamat, 
                rp.created_at AS riwayat_created_at,
        
                cf.id AS catatan_id,
                cf.admin_id,
                cf.catatan,
        
                jk.tanggal_kunjungan,
                jk.waktu,
                jk.keterangan AS jadwal_keterangan,
                jk.updated_at AS jadwal_updated_at
        
            FROM riwayat_pasien rp
            LEFT JOIN pasiens p ON rp.pasien_id = p.user_id 
            LEFT JOIN catatan_feedback cf ON cf.riwayat_id = rp.id
            LEFT JOIN jadwal_kunjungan jk 
                ON jk.id_riwayat = rp.id AND jk.status = 'done' -- hanya ambil jika status selesai
        
            WHERE p.user_id = ?
            AND (rp.keluhan LIKE ? OR cf.catatan LIKE ? OR jk.keterangan LIKE ?)
            ORDER BY rp.created_at DESC
            LIMIT ? OFFSET ?
        `, [userId, keyword, keyword, keyword, limit, offset]);

        // Menyusun informasi pagination
        const totalPages = Math.ceil(count / limit);
        const pagination = {
            total: count,
            currentPage: Math.floor(offset / limit) + 1,
            nextPage: (Math.floor(offset / limit) + 1) < totalPages ? (Math.floor(offset / limit) + 1) + 1 : null,
            previousPage: Math.floor(offset / limit) > 0 ? Math.floor(offset / limit) : null,
            totalPages: totalPages
        };

        return {
            data: result,
            pagination: pagination
        };
    } catch (error) {
        throw new ResponseError(500, 'Gagal mengambil riwayat data pasien: ' + error.message);
    }
};

exports.getAllJadwalKunjungan = async (userId, limit = 10, offset = 0) => {
    try {
        // Hitung total data jadwal kunjungan untuk pasien tertentu
        const [[{ count }]] = await db.query(`
            SELECT COUNT(*) AS count
            FROM jadwal_kunjungan
            WHERE pasien_id = ?
        `, [userId]);

        // Jika tidak ada data
        if (count === 0) {
            throw new ResponseError(404, 'Jadwal kunjungan tidak ditemukan');
        }

        // Ambil data jadwal kunjungan dengan pagination
        const [result] = await db.query(`
            SELECT 
            jk.*, 
            rp.keluhan
            FROM jadwal_kunjungan jk
            LEFT JOIN riwayat_pasien rp ON jk.id_riwayat = rp.id
            WHERE jk.pasien_id = ?
            ORDER BY jk.tanggal_kunjungan DESC
            LIMIT ? OFFSET ?
        `, [userId, limit, offset]);

        // Hitung pagination
        const totalPages = Math.ceil(count / limit);
        const currentPage = Math.floor(offset / limit) + 1;

        const pagination = {
            total: count,
            currentPage: currentPage,
            nextPage: currentPage < totalPages ? currentPage + 1 : null,
            previousPage: currentPage > 1 ? currentPage - 1 : null,
            totalPages: totalPages
        };

        return {
            data: result,
            pagination: pagination
        };
    } catch (error) {
        throw new ResponseError(500, 'Gagal mengambil jadwal kunjungan: ' + error.message);
    }
};

// exports.getNotifyPatient = async (userId) => {
//     try {
//         const [result] = await db.query('SELECT * FROM riwayat_pasien WHERE pasien_id = ?', [userId]);

//         if (result.length === 0) {
//             throw new ResponseError(404, 'Riwayat pasien tidak ditemukan');
//         }

//         const [notify] = await db.query(`
//             SELECT cf.*
//             FROM catatan_feedback cf
//             JOIN riwayat_pasien rp ON cf.riwayat_id = rp.id
//             WHERE rp.pasien_id = ?
//         `, [userId]);

//         if (notify.length === 0) {
//             throw new ResponseError(404, 'Notifikasi pasien tidak ditemukan');
//         }

//         return notify;
//     } catch (error) {
//         throw new ResponseError(500, 'Gagal mengambil notifikasi pasien: ' + error.message);
//     }
// }

exports.updateJadwalKunjungan = async (jadwalKunjunganId, status) => {
    try {
        const allowedStatus = ['pending', 'confirmed', 'done', 'rescheduled', 'canceled'];

        if (!allowedStatus.includes(status)) {
            throw new ResponseError(400, 'Status tidak valid');
        }

        const [schedule] = await db.query('SELECT * FROM jadwal_kunjungan WHERE id = ?', [jadwalKunjunganId]);

        if (schedule.length === 0) {
            throw new ResponseError(404, 'Jadwal kunjungan tidak ditemukan');
        }

        await db.query(`
            UPDATE jadwal_kunjungan 
            SET status = ?, is_read_admin = 0, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, [status, jadwalKunjunganId]);


        return null;
    } catch (error) {
        throw new ResponseError(500, 'Gagal mengubah jadwal kunjungan: ' + error.message);
    }
}