const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/admin/adminController');
const patienManagementController = require('../../controllers/admin/patienManagementController');
const reportController = require('../../controllers/admin/reportController');
const dashboardController = require('../../controllers/admin/dashboardController');
const notifikasiController = require('../../controllers/admin/notifikasiController');
const authenticate = require('../../utils/middleware/authMiddleware');

//dashboard
router.get('/dashboard', dashboardController.getDashboardData);
router.get('/chart-kunjungan', dashboardController.getKunjunganChart);

//pasien
router.post('/pasien', adminController.createPasien);
router.get('/pasien', adminController.getAllPasien);
router.get('/pasien/:id', adminController.getPasienById);
router.put('/pasien/:id', adminController.editPasien);

//riwayat pasien
// router.get('/riwayat-pasien', patienManagementController.getAllRiwayat); //belum implentasi
router.get('/pasien-konsultasi', patienManagementController.getPasienKonsultasiTerbaru);
router.get('/riwayat-pasien/:id', patienManagementController.getAllRiwayatByPasienId);
router.get('/konsultasi-pasien/:id', patienManagementController.getAllKonsultasiByPasienId);
router.post('/notify-patient/:id', patienManagementController.createNotifyPatientWithResult);

//jadwal kunjungan
// router.post('/buat-jadwal', adminController.createJadwalKunjungan);
router.post('/jadwal-kunjungan', patienManagementController.createJadwalKunjungan);
router.get('/jadwal-kunjungan', patienManagementController.getAllJadwalKunjungan); //sudah di filter berdasarkan tanggal kunjungan atau nama pasien
router.put('/jadwal-kunjungan/:id', patienManagementController.editJadwalKunjungan);
router.delete('/jadwal-kunjungan/:id', patienManagementController.deleteJadwalKunjungan);

//report management
router.get('/per-pasien/:id', reportController.getReportByPasienId);
router.get('/tahunan/:year', reportController.getAnnualReport);
router.get('/bulanan/:year/:month', reportController.getMonthlyReport);


//notifikasi
router.get('/all-notifikasi', authenticate, notifikasiController.getAdminAllNotifikasi);
router.get('/notifikasi', authenticate, notifikasiController.getAdminNotifikasi);
router.patch('/notifikasi/baca', notifikasiController.markNotifikasiAdminRead);

module.exports = router;