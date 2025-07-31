const db = require('../../config/db');
const { ResponseError } = require('../../utils/response');

exports.getUserNotifikasi = async (userId) => {
    try {
        const [notifLogs] = await db.query(`
            SELECT 
                log.id,
                log.jadwal_id,
                log.is_read,
                log.status,
                log.created_at,
                DATE_FORMAT(jk.tanggal_kunjungan, '%Y-%m-%d') AS tanggal_kunjungan,
                jk.waktu,
                rk.keluhan,
                p.nama_lengkap
            FROM log_notifikasi_user log
            JOIN jadwal_kunjungan jk ON jk.id = log.jadwal_id
            JOIN riwayat_pasien rk ON jk.id_riwayat = rk.id
            JOIN pasiens p ON jk.pasien_id = p.user_id
            WHERE log.pasien_id = ?
            ORDER BY log.created_at DESC
        `, [userId]);

        return { notifikasi: notifLogs };
    } catch (err) {
        throw new ResponseError(500, 'Gagal mengambil notifikasi pasien');
    }
};

exports.getUserAllNotifikasi = async (userId, page = 1, limit = 10, tanggal = '') => {
    try {
        const offset = (page - 1) * limit;

        // Count total notifikasi
        const [countRows] = await db.query(`
            SELECT COUNT(*) AS total
            FROM log_notifikasi_user log
            JOIN jadwal_kunjungan jk ON jk.id = log.jadwal_id
            WHERE log.pasien_id = ?
            ${tanggal ? 'AND DATE(log.created_at) = ?' : ''}
        `, tanggal ? [userId, tanggal] : [userId]);

        const total = countRows[0]?.total || 0;

        // Fetch notifikasi with pagination
        const [notifLogs] = await db.query(`
            SELECT 
                log.id,
                log.jadwal_id AS sumber_id,
                log.is_read,
                log.status,
                log.created_at AS waktu,
                DATE_FORMAT(jk.tanggal_kunjungan, '%Y-%m-%d') AS tanggal_kunjungan,
                jk.waktu AS waktu_kunjungan,
                rk.keluhan,
                p.nama_lengkap,
                'jadwal' AS tipe
            FROM log_notifikasi_user log
            JOIN jadwal_kunjungan jk ON jk.id = log.jadwal_id
            JOIN riwayat_pasien rk ON jk.id_riwayat = rk.id
            JOIN pasiens p ON jk.pasien_id = p.user_id
            WHERE log.pasien_id = ?
            ${tanggal ? 'AND DATE(log.created_at) = ?' : ''}
            ORDER BY log.created_at DESC
            LIMIT ? OFFSET ?
        `, tanggal ? [userId, tanggal, limit, offset] : [userId, limit, offset]);

        const totalPages = Math.ceil(total / limit);

        return {
            notifikasi: notifLogs,
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
        throw new ResponseError(500, 'Gagal mengambil semua notifikasi user');
    }
};


exports.markUserNotifikasiRead = async (userId) => {
    try {
        await db.query(`
            UPDATE log_notifikasi_user 
            SET is_read = 1 
            WHERE pasien_id = ? AND is_read = 0
        `, [userId]);
    } catch (err) {
        throw new ResponseError(500, 'Gagal menandai notifikasi pasien');
    }
};
