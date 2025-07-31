const db = require('../../config/db');
const { ResponseError } = require('../../utils/response');

exports.getReportByPasienId = async (id) => {
    try {
        const [biodata] = await db.query(
            `SELECT u.id, p.nama_lengkap, p.nik, p.tanggal_lahir, p.jenis_kelamin, p.alamat
         FROM users u
         JOIN pasiens p ON u.id = p.user_id
         WHERE u.id = ?`,
            [id]
        );

        if (!biodata.length) throw new ResponseError(404, 'Pasien tidak ditemukan');

        const [riwayat] = await db.query(
            `SELECT r.id, r.keluhan, r.alamat, r.created_at,
                f.catatan, f.created_at AS catatan_created
         FROM riwayat_pasien r
         LEFT JOIN catatan_feedback f ON r.id = f.riwayat_id
         WHERE r.pasien_id = ?
         ORDER BY r.created_at DESC`,
            [id]
        );

        const [kunjungan] = await db.query(
            `SELECT tanggal_kunjungan, waktu, keterangan
         FROM jadwal_kunjungan
         WHERE pasien_id = ? AND status = 'done'
         ORDER BY tanggal_kunjungan DESC`,
            [id]
        );

        return {
            pasien: biodata[0],
            riwayat,
            kunjungan
        };
    } catch (err) {
        throw err instanceof ResponseError
            ? err
            : new ResponseError(500, 'Gagal mengambil laporan individu: ' + err.message);
    }
};

exports.getAnnualReport = async (year) => {
    try {
        const [jumlahPasien] = await db.query(
            `SELECT COUNT(DISTINCT pasien_id) AS total_pasien
             FROM jadwal_kunjungan
             WHERE status = 'done' AND YEAR(tanggal_kunjungan) = ?`,
            [year]
        );

        const [jenisKelaminRows] = await db.query(
            `SELECT p.jenis_kelamin, COUNT(DISTINCT jk.pasien_id) AS jumlah
             FROM jadwal_kunjungan jk
             JOIN pasiens p ON jk.pasien_id = p.user_id
             WHERE jk.status = 'done' AND YEAR(jk.tanggal_kunjungan) = ?
             GROUP BY p.jenis_kelamin`,
            [year]
        );

        const jumlah_jenis_kelamin = {
            L: 0,
            P: 0
        };
        for (const row of jenisKelaminRows) {
            if (row.jenis_kelamin === 'L') jumlah_jenis_kelamin.L = row.jumlah;
            if (row.jenis_kelamin === 'P') jumlah_jenis_kelamin.P = row.jumlah;
        }

        const [kunjunganPerBulan] = await db.query(
            `SELECT MONTH(tanggal_kunjungan) AS bulan, COUNT(*) AS jumlah
         FROM jadwal_kunjungan
         WHERE status = 'done' AND YEAR(tanggal_kunjungan) = ?
         GROUP BY MONTH(tanggal_kunjungan)
         ORDER BY bulan`,
            [year]
        );


        const [pasienTerbanyak] = await db.query(
            `SELECT p.nama_lengkap, COUNT(*) AS jumlah_kunjungan
         FROM jadwal_kunjungan jk
         JOIN pasiens p ON jk.pasien_id = p.user_id
         WHERE jk.status = 'done' AND YEAR(jk.tanggal_kunjungan) = ?
         GROUP BY jk.pasien_id
         ORDER BY jumlah_kunjungan DESC
         LIMIT 5`,
            [year]
        );

        return {
            tahun: year,
            total_pasien: jumlahPasien[0]?.total_pasien || 0,
            jumlah_jenis_kelamin,
            kunjungan_per_bulan: kunjunganPerBulan,
            pasien_terbanyak: pasienTerbanyak,
        };
    } catch (err) {
        throw new ResponseError(500, 'Gagal mengambil laporan tahunan: ' + err.message);
    }
};

exports.getMonthlyReport = async (year, month) => {
    try {
        const [jumlahPasien] = await db.query(
            `SELECT COUNT(DISTINCT pasien_id) AS total_pasien
             FROM jadwal_kunjungan
             WHERE status = 'done'
               AND YEAR(tanggal_kunjungan) = ?
               AND MONTH(tanggal_kunjungan) = ?`,
            [year, month]
        );

        const [jenisKelaminRows] = await db.query(
            `SELECT p.jenis_kelamin, COUNT(DISTINCT jk.pasien_id) AS jumlah
             FROM jadwal_kunjungan jk
             JOIN pasiens p ON jk.pasien_id = p.user_id
             WHERE jk.status = 'done'
               AND YEAR(jk.tanggal_kunjungan) = ?
               AND MONTH(jk.tanggal_kunjungan) = ?
             GROUP BY p.jenis_kelamin`,
            [year, month]
        );

        const jumlah_jenis_kelamin = {
            L: 0,
            P: 0
        };
        for (const row of jenisKelaminRows) {
            if (row.jenis_kelamin === 'L') jumlah_jenis_kelamin.L = row.jumlah;
            if (row.jenis_kelamin === 'P') jumlah_jenis_kelamin.P = row.jumlah;
        }

        const [kunjunganPerHari] = await db.query(
            `SELECT DAY(tanggal_kunjungan) AS hari, COUNT(*) AS jumlah
             FROM jadwal_kunjungan
             WHERE status = 'done'
               AND YEAR(tanggal_kunjungan) = ?
               AND MONTH(tanggal_kunjungan) = ?
             GROUP BY DAY(tanggal_kunjungan)
             ORDER BY hari`,
            [year, month]
        );

        const [pasienTerbanyak] = await db.query(
            `SELECT p.nama_lengkap, COUNT(*) AS jumlah_kunjungan
             FROM jadwal_kunjungan jk
             JOIN pasiens p ON jk.pasien_id = p.user_id
             WHERE jk.status = 'done'
               AND YEAR(jk.tanggal_kunjungan) = ?
               AND MONTH(jk.tanggal_kunjungan) = ?
             GROUP BY jk.pasien_id
             ORDER BY jumlah_kunjungan DESC
             LIMIT 5`,
            [year, month]
        );

        return {
            tahun: year,
            bulan: month,
            total_pasien: jumlahPasien[0]?.total_pasien || 0,
            jumlah_jenis_kelamin,
            kunjungan_per_hari: kunjunganPerHari,
            pasien_terbanyak: pasienTerbanyak,
        };
    } catch (err) {
        throw new ResponseError(500, 'Gagal mengambil laporan bulanan: ' + err.message);
    }
};

