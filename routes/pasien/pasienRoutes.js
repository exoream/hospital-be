const express = require('express');
const router = express.Router();
const pasiendController = require('../../controllers/pasien/pasienController');
const userNotifikasiController = require('../../controllers/pasien/notifikasiController');
const dashboardController = require('../../controllers/pasien/dashboardController');
const authenticate = require('../../utils/middleware/authMiddleware');
//riwayat
router.post('/riwayat', pasiendController.createRiwayat);
router.get('/riwayat', pasiendController.getAllRiwayat);

router.get('/jadwal-kunjungan', pasiendController.getAllJadwalKunjungan);
router.put('/jadwal-kunjungan/:id', pasiendController.updateJadwalKunjungan);

// notifikasi pasien
router.get('/dashboard', authenticate, dashboardController.getDashboardDataPasien);
router.get('/notifikasi', authenticate, userNotifikasiController.getUserNotifikasi);
router.get('/all-notifikasi', authenticate, userNotifikasiController.getUserAllNotifikasi);
router.patch('/notifikasi/baca', authenticate, userNotifikasiController.markUserNotifikasiRead);


module.exports = router;