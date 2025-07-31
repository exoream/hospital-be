const db = require('../../config/db');
const { ResponseError } = require('../../utils/response');

exports.getDashboardPasienOverview = async (userId) => {
    try {
        // Total pengajuan konsultasi (riwayat)
        const [[totalRiwayat]] = await db.query(`
      SELECT COUNT(*) AS total
      FROM riwayat_pasien
      WHERE pasien_id = ?
    `, [userId]);

        // Total catatan yang telah diberikan admin
        const [[totalCatatan]] = await db.query(`
      SELECT COUNT(*) AS total
      FROM catatan_feedback cf
      JOIN riwayat_pasien rp ON cf.riwayat_id = rp.id
      WHERE rp.pasien_id = ?
    `, [userId]);

        // Total kunjungan yang telah selesai
        const [[totalKunjunganSelesai]] = await db.query(`
      SELECT COUNT(*) AS total
      FROM jadwal_kunjungan
      WHERE pasien_id = ? AND status = 'done'
    `, [userId]);

        // Jumlah jadwal mendatang (pending / confirmed dan tanggal >= hari ini)
        const [[jadwalMendatang]] = await db.query(`
      SELECT COUNT(*) AS total
      FROM jadwal_kunjungan
      WHERE pasien_id = ?
        AND status IN ('pending', 'confirmed')
        AND tanggal_kunjungan >= CURDATE()
    `, [userId]);

        // Apakah hari ini ada jadwal kunjungan
        const [[kunjunganHariIni]] = await db.query(`
      SELECT COUNT(*) AS total
      FROM jadwal_kunjungan
      WHERE pasien_id = ? AND tanggal_kunjungan = CURDATE()
    `, [userId]);

        return {
            total_riwayat: totalRiwayat.total,
            total_catatan: totalCatatan.total,
            total_kunjungan_selesai: totalKunjunganSelesai.total,
            jadwal_mendatang: jadwalMendatang.total,
            kunjungan_hari_ini: kunjunganHariIni.total
        };
    } catch (err) {
        throw new ResponseError(500, 'Gagal mengambil data dashboard pasien: ' + err.message);
    }
};