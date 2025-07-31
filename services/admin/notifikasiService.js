const db = require('../../config/db');
const { ResponseError } = require('../../utils/response');

exports.getAdminNotifikasi = async (adminId) => {
    try {
        const [notifList] = await db.query(`
            (
                SELECT 
                    rp.id AS sumber_id,
                    'riwayat' AS tipe,
                    rp.created_at AS waktu,
                    NULL AS tanggal_kunjungan,
                    NULL AS waktu_kunjungan,
                    rp.keluhan,
                    NULL AS status, 
                    p.nama_lengkap,
                    p.jenis_kelamin,
                    p.tanggal_lahir,
                    p.alamat AS alamat_pasien,
                    rp.is_read AS is_read
                FROM riwayat_pasien rp
                JOIN pasiens p ON rp.pasien_id = p.user_id
            )
            UNION ALL
            (
                SELECT 
                    jk.id AS sumber_id,
                    'jadwal' AS tipe,
                    COALESCE(jk.updated_at, jk.created_at) AS waktu,
                    DATE_FORMAT(jk.tanggal_kunjungan, '%Y-%m-%d') AS tanggal_kunjungan,
                    jk.waktu AS waktu_kunjungan,
                    NULL AS keluhan,
                    jk.status AS status,  
                    p.nama_lengkap,
                    p.jenis_kelamin,
                    p.tanggal_lahir,
                    p.alamat AS alamat_pasien,
                    jk.is_read_admin AS is_read
                FROM jadwal_kunjungan jk
                JOIN pasiens p ON jk.pasien_id = p.user_id
            )
            ORDER BY waktu DESC
            LIMIT 10
        `, [adminId]);

        return notifList;
    } catch (err) {
        throw new ResponseError(500, 'Gagal mengambil notifikasi admin');
    }
};

exports.getAdminAllNotifikasi = async (page = 1, limit = 10, tanggal = '') => {
    try {
        const offset = (page - 1) * limit;

        // Count query
        const [countRows] = await db.query(`
            SELECT COUNT(*) AS total FROM (
                (
                    SELECT rp.id, rp.created_at AS waktu
                    FROM riwayat_pasien rp
                    JOIN pasiens p ON rp.pasien_id = p.user_id
                    ${tanggal ? 'WHERE DATE(rp.created_at) = ?' : ''}
                )
                UNION ALL
                (
                    SELECT jk.id, COALESCE(jk.updated_at, jk.created_at) AS waktu
                    FROM jadwal_kunjungan jk
                    JOIN pasiens p ON jk.pasien_id = p.user_id
                    ${tanggal ? 'WHERE DATE(COALESCE(jk.updated_at, jk.created_at)) = ?' : ''}
                )
            ) AS all_notif
        `, tanggal ? [tanggal, tanggal] : []);

        const total = countRows[0].total;

        // Main query
        const [notifList] = await db.query(`
            (
                SELECT 
                    rp.id AS sumber_id,
                    'riwayat' AS tipe,
                    rp.created_at AS waktu,
                    NULL AS tanggal_kunjungan,
                    NULL AS waktu_kunjungan,
                    rp.keluhan,
                    NULL AS status, 
                    p.nama_lengkap,
                    p.jenis_kelamin,
                    p.tanggal_lahir,
                    p.alamat AS alamat_pasien,
                    rp.is_read AS is_read
                FROM riwayat_pasien rp
                JOIN pasiens p ON rp.pasien_id = p.user_id
                ${tanggal ? 'WHERE DATE(rp.created_at) = ?' : ''}
            )
            UNION ALL
            (
                SELECT 
                    jk.id AS sumber_id,
                    'jadwal' AS tipe,
                    COALESCE(jk.updated_at, jk.created_at) AS waktu,
                    DATE_FORMAT(jk.tanggal_kunjungan, '%Y-%m-%d') AS tanggal_kunjungan,
                    jk.waktu AS waktu_kunjungan,
                    NULL AS keluhan,
                    jk.status AS status,  
                    p.nama_lengkap,
                    p.jenis_kelamin,
                    p.tanggal_lahir,
                    p.alamat AS alamat_pasien,
                    jk.is_read_admin AS is_read
                FROM jadwal_kunjungan jk
                JOIN pasiens p ON jk.pasien_id = p.user_id
                ${tanggal ? 'WHERE DATE(COALESCE(jk.updated_at, jk.created_at)) = ?' : ''}
            )
            ORDER BY waktu DESC
            LIMIT ? OFFSET ?
        `, tanggal ? [tanggal, tanggal, limit, offset] : [limit, offset]);

        const totalPages = Math.ceil(total / limit);

        return {
            data: notifList,
            pagination: {
                total,
                page,
                limit,
                totalPages,
                nextPage: page < totalPages ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null
            }
        };
    } catch (err) {
        throw new ResponseError(500, 'Gagal mengambil notifikasi admin');
    }
};


exports.markNotifikasiAdminRead = async () => {
    try {
        await db.query(`UPDATE riwayat_pasien SET is_read = 1 WHERE is_read = 0`);
        await db.query(`UPDATE jadwal_kunjungan SET is_read_admin = 1 WHERE is_read_admin = 0`);
    } catch (err) {
        throw new ResponseError(500, 'Gagal menandai notifikasi admin');
    }
};
