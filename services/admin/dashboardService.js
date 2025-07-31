const db = require('../../config/db');
const { ResponseError } = require('../../utils/response');

exports.getDashboardOverview = async () => {
  try {
    const [[totalPasien]] = await db.query(`
        SELECT COUNT(*) AS total FROM users WHERE role = 'pasien'
      `);

    const [[totalRiwayat]] = await db.query(`
        SELECT COUNT(*) AS total FROM riwayat_pasien
      `);

    const [[totalKunjungan]] = await db.query(`
        SELECT COUNT(*) AS total FROM jadwal_kunjungan
      `);

    const [[kunjunganHariIni]] = await db.query(`
        SELECT COUNT(*) AS total FROM jadwal_kunjungan
        WHERE tanggal_kunjungan = CURDATE()
      `);

    return {
      total_pasien: totalPasien.total,
      total_riwayat: totalRiwayat.total,
      total_kunjungan: totalKunjungan.total,
      kunjungan_hari_ini: kunjunganHariIni.total,
    };
  } catch (err) {
    throw new ResponseError(500, 'Gagal mengambil data dashboard');
  }
};

exports.getKunjunganPerHari = async () => {
  const [data] = await db.query(`
    SELECT DATE(tanggal_kunjungan) AS tanggal, COUNT(*) AS jumlah
    FROM jadwal_kunjungan
    WHERE status = 'done'
      AND tanggal_kunjungan >= CURDATE() - INTERVAL 6 DAY
    GROUP BY tanggal
    ORDER BY tanggal ASC
  `);

  return data;
};