const db = require('../../config/db');
const { ResponseError } = require('../../utils/response');
const Validation = require("../../utils/validations/validation");
const PasienManagementValidation = require("../../utils/validations/patientManagementValidation");

exports.getAllRiwayatByPasienId = async (pasienId, limit = 10, offset = 0) => {
    try {
        const [[{ count }]] = await db.query(`
        SELECT COUNT(rp.id) AS count
        FROM riwayat_pasien rp
        WHERE rp.pasien_id = ?
      `, [pasienId]);

        const [result] = await db.query(`
        SELECT 
          rp.id AS riwayat_id,
          rp.keluhan,
          rp.alamat,
          rp.created_at AS riwayat_created_at,
  
          -- Catatan dari feedback
          cf.catatan,
          cf.created_at AS catatan_created_at,
  
          -- Keterangan dari jadwal_kunjungan jika status = 'done'
          jk.keterangan AS jadwal_keterangan,
          jk.updated_at AS jadwal_updated_at
  
        FROM riwayat_pasien rp
        LEFT JOIN catatan_feedback cf ON cf.riwayat_id = rp.id
        LEFT JOIN jadwal_kunjungan jk 
          ON jk.id_riwayat = rp.id AND jk.status = 'done'
  
        WHERE rp.pasien_id = ?
        ORDER BY rp.created_at DESC
        LIMIT ? OFFSET ?
      `, [pasienId, limit, offset]);

        const totalPages = Math.ceil(count / limit);
        const pagination = {
            total: count,
            currentPage: Math.floor(offset / limit) + 1,
            nextPage: (Math.floor(offset / limit) + 1) < totalPages ? (Math.floor(offset / limit) + 2) : null,
            previousPage: Math.floor(offset / limit) > 0 ? Math.floor(offset / limit) : null,
            totalPages
        };

        return {
            data: result,
            pagination
        };
    } catch (error) {
        throw new ResponseError(500, 'Gagal mengambil riwayat lengkap pasien: ' + error.message);
    }
};

exports.getAllKonsultasiByPasienId = async (pasienId, limit, offset) => {
    try {
        // Query untuk menghitung total riwayat pasien
        const [[{ count }]] = await db.query(`
            SELECT COUNT(riwayat_pasien.id) as count 
            FROM riwayat_pasien 
            LEFT JOIN pasiens ON riwayat_pasien.pasien_id = pasiens.user_id
            LEFT JOIN catatan_feedback ON catatan_feedback.riwayat_id = riwayat_pasien.id
            WHERE pasiens.user_id = ?
        `, [pasienId]);

        // Query untuk mengambil riwayat pasien dengan pagination
        const [result] = await db.query(`
            SELECT 
                riwayat_pasien.id AS riwayat_id,
            riwayat_pasien.keluhan,
            riwayat_pasien.alamat,
            riwayat_pasien.created_at,
            catatan_feedback.id AS catatan_id,
            catatan_feedback.admin_id,
            catatan_feedback.catatan
            FROM riwayat_pasien 
            LEFT JOIN pasiens ON riwayat_pasien.pasien_id = pasiens.user_id 
            LEFT JOIN catatan_feedback ON catatan_feedback.riwayat_id = riwayat_pasien.id
            WHERE pasiens.user_id = ?
            ORDER BY riwayat_pasien.created_at DESC
            LIMIT ? OFFSET ?
        `, [pasienId, limit, offset]);

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
        throw new ResponseError(500, 'Gagal mengambil daftar konsultasi data pasien: ' + error.message);
    }
};


exports.createNotifyPatientWithResult = async (adminId, riwayatPasienId, data) => {
    try {
        // const { keluhan, penyakit } = data;
        const { catatan } = data;

        if (!catatan) {
            throw new ResponseError(400, 'Catatan tidak boleh kosong');
        }

        const [note] = await db.query(`
            SELECT * FROM riwayat_pasien WHERE id = ?
            `, [riwayatPasienId]);

        if (note.length === 0) {
            throw new ResponseError(404, 'Riwayat Data pasien tidak ditemukan');
        }

        const [record] = await db.query(`
            SELECT * FROM catatan_feedback WHERE riwayat_id = ?
            `, [riwayatPasienId]);

        if (record.length > 0) {
            throw new ResponseError(400, 'Catatan sudah ada');
        }


        const [result] = await db.query(`
            INSERT INTO catatan_feedback (riwayat_id, admin_id, catatan) 
            VALUES (?, ?, ?)
            `, [riwayatPasienId, adminId, catatan]);
        return null;
    } catch (error) {
        throw new ResponseError(500, 'Gagal mengirim notifikasi ke pasien: ' + error.message);
    }
}

exports.getPasienKonsultasiTerbaru = async () => {
    const [result] = await db.query(`
        SELECT 
            rp.id AS riwayat_id,
            rp.pasien_id,
            rp.keluhan,
            rp.created_at AS riwayat_created_at,
            p.nama_lengkap,
            p.alamat,
            cf.catatan,
            cf.created_at AS catatan_created_at
        FROM riwayat_pasien rp
        INNER JOIN pasiens p ON rp.pasien_id = p.user_id
        INNER JOIN users u ON u.id = p.user_id
        LEFT JOIN jadwal_kunjungan jk ON jk.id_riwayat = rp.id
        INNER JOIN catatan_feedback cf ON cf.riwayat_id = rp.id
        WHERE u.role = 'pasien'
          AND jk.id IS NULL
        ORDER BY cf.created_at DESC
    `);
    return result;
};

//CRUD jadwal kunjungan
exports.createJadwalKunjungan = async (data) => {
    try {
        const validData = Validation.validate(PasienManagementValidation.createSchema, data);
        const { pasien_id, riwayat_id, tanggal_kunjungan, waktu } = validData;

        const [insert] = await db.query(`
        INSERT INTO jadwal_kunjungan (pasien_id, id_riwayat, tanggal_kunjungan, waktu,  admin_id, is_read_admin)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [pasien_id, riwayat_id, tanggal_kunjungan, waktu, 1, 1]);

        await db.query(`
        INSERT INTO log_notifikasi_user (pasien_id, jadwal_id)
        VALUES (?, ?)
      `, [pasien_id, insert.insertId]);


        return { id: insert.insertId };
    } catch (error) {
        throw new ResponseError(500, 'Gagal membuat jadwal kunjungan: ' + error.message);
    }

};

exports.getAllJadwalKunjungan = async (data, limit = 10, offset = 0) => {
    try {
        let query = `
            SELECT jk.*, DATE_FORMAT(jk.tanggal_kunjungan, '%Y-%m-%d') AS tanggal_kunjungan, p.nama_lengkap, rp.keluhan AS keluhan_riwayat, rp.created_at AS riwayat_created_at
            FROM jadwal_kunjungan jk
            LEFT JOIN pasiens p ON jk.pasien_id = p.user_id
            LEFT JOIN riwayat_pasien rp ON jk.id_riwayat = rp.id
            WHERE 1 = 1
        `;

        const params = [];

        // Menambahkan filter pencarian jika ada data
        if (data) {
            const { nama_lengkap, tanggal_kunjungan } = data;

            if (nama_lengkap != null) {
                query += ' AND p.nama_lengkap LIKE ?';
                params.push(`%${nama_lengkap}%`);
            }

            if (tanggal_kunjungan != null) {
                const tanggal = new Date(tanggal_kunjungan).toISOString().split('T')[0]; // hasil: '2025-05-19'
                query += ' AND jk.tanggal_kunjungan = ?';
                params.push(tanggal);
            }
        }

        // Hitung total jumlah data
        const countQuery = `
            SELECT COUNT(*) AS count
            FROM jadwal_kunjungan jk
            LEFT JOIN pasiens p ON jk.pasien_id = p.user_id
            WHERE 1 = 1
        `;
        const [[{ count }]] = await db.query(countQuery, params);

        if (count === 0) {
            throw new ResponseError(404, 'Jadwal kunjungan tidak ditemukan');
        }

        // Tambahkan pagination pada query
        query += ' ORDER BY jk.tanggal_kunjungan DESC LIMIT ? OFFSET ?';
        const dataParams = [...params, parseInt(limit), parseInt(offset)];

        // Ambil data sesuai pagination
        const [result] = await db.query(query, dataParams);

        // Hitung pagination
        const totalPages = Math.ceil(count / limit);
        const currentPage = Math.floor(offset / limit) + 1;

        const pagination = {
            total: count,
            currentPage,
            nextPage: currentPage < totalPages ? currentPage + 1 : null,
            previousPage: currentPage > 1 ? currentPage - 1 : null,
            totalPages
        };

        return {
            data: result,
            pagination
        };
    } catch (error) {
        throw new ResponseError(500, 'Gagal mengambil jadwal kunjungan: ' + error.message);
    }
};


exports.editJadwalKunjungan = async (adminId, jadwalKunjunganId, data) => {
    try {

        const validData = Validation.validate(PasienManagementValidation.updateSchema, data);
        const { tanggal_kunjungan, waktu, keterangan, status } = validData;

        const allowedStatus = ['pending', 'confirmed', 'done', 'rescheduled', 'canceled'];

        const [existing] = await db.query(
            'SELECT tanggal_kunjungan, waktu FROM jadwal_kunjungan WHERE id = ?',
            [jadwalKunjunganId]
        );

        if (existing.length === 0) {
            throw new ResponseError(404, 'Jadwal kunjungan tidak ditemukan');
        }
        const existingData = existing[0];
        const existingTanggal = existingData.tanggal_kunjungan.toISOString().split('T')[0];
        const existingWaktu = existingData.waktu.slice(0, 5);
        // console.log('Normalized tanggal:', tanggal_kunjungan, 'vs', existingTanggal);
        // console.log('Normalized waktu:', waktu, 'vs', existingWaktu);

        const fields = [];
        const params = [];

        let shouldReschedule = false;

        if (tanggal_kunjungan && tanggal_kunjungan !== existingTanggal) {
            fields.push('tanggal_kunjungan = ?');
            params.push(tanggal_kunjungan);
            shouldReschedule = true;
        }

        if (waktu && waktu !== existingWaktu) {
            fields.push('waktu = ?');
            params.push(waktu);
            shouldReschedule = true;
        }

        if (keterangan) {
            fields.push('keterangan = ?');
            params.push(keterangan);
        }

        console.log('Should reschedule?', shouldReschedule);

        // Status logic: jika tanggal atau waktu berubah, ubah status menjadi 'rescheduled'
        let finalStatus = status ? status : null;

        // Cek apakah status dikirim dan apakah tanggal/waktu diubah
        console.log(shouldReschedule, finalStatus);
        if (finalStatus === "done" || finalStatus === "canceled") {
            const [rows] = await db.query(
                'SELECT pasien_id FROM jadwal_kunjungan WHERE id = ?',
                [jadwalKunjunganId]
            );

            const pasienId = rows[0]?.pasien_id;
            fields.push('updated_at = CURRENT_TIMESTAMP');

            await db.query(`
                INSERT INTO log_notifikasi_user (pasien_id, jadwal_id, status, is_read, created_at)
                VALUES (?, ?, ?, ?, NOW())
              `, [pasienId, jadwalKunjunganId, finalStatus, false]);
        }

        if (shouldReschedule && finalStatus == null) {
            finalStatus = 'rescheduled';  // jika tidak ada status, otomatis 'rescheduled'
        }

        // Jika status dikirim, dan ada perubahan tanggal/waktu, otomatis set 'rescheduled'
        if (shouldReschedule && finalStatus && finalStatus !== 'rescheduled') {
            finalStatus = 'rescheduled'; // Paksa jadi 'rescheduled' jika ada perubahan tanggal/waktu
        }

        // Validasi status (jika ada)
        if (finalStatus) {
            if (!allowedStatus.includes(finalStatus)) {
                throw new ResponseError(400, 'Status tidak valid');
            }
            fields.push('status = ?');
            params.push(finalStatus);
        }

        // Selalu update admin_id
        fields.push('admin_id = ?');
        params.push(adminId);

        // ID untuk WHERE
        params.push(jadwalKunjunganId);

        // Validasi minimal perubahan
        if (fields.length <= 1) {
            throw new ResponseError(400, 'Tidak ada data yang diubah.');
        }

        // Buat query dinamis
        const query = `
            UPDATE jadwal_kunjungan 
            SET ${fields.join(', ')} 
            WHERE id = ?
            `;

        const [result] = await db.query(query, params);
        return result;
    } catch (error) {
        throw new ResponseError(500, 'Gagal mengubah jadwal kunjungan: ' + error.message);
    }
}


exports.deleteJadwalKunjungan = async (jadwalKunjunganId) => {
    try {
        if (!jadwalKunjunganId) {
            throw new ResponseError(400, 'ID jadwal kunjungan tidak boleh kosong');
        }

        const [result] = await db.query(`
            DELETE FROM jadwal_kunjungan WHERE id = ?
            `, [jadwalKunjunganId]);
        return result;
    } catch (error) {
        throw new ResponseError(500, 'Gagal menghapus jadwal kunjungan: ' + error.message);
    }
}