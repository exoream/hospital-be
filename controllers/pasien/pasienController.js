const pasienService = require('../../services/pasien/pasienService');
const { successResponse, errorResponse } = require('../../utils/response');

exports.createRiwayat = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = req.body;
        const result = await pasienService.createRiwayat(userId, data);
        res.status(201).json(successResponse('Riwayat pasien berhasil ditambahkan', result));
    } catch (error) {
        res.status(500).json(errorResponse(error.message));
    }
}

exports.getAllRiwayat = async (req, res) => {
    try {
        const userId = req.user.id;
        const search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const result = await pasienService.getAllRiwayat(userId, limit, offset, search);
        res.status(200).json(successResponse('Riwayat pasien berhasil diambil', result));
    } catch (error) {
        res.status(500).json(errorResponse(error.message));
    }
}

exports.getAllJadwalKunjungan = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const result = await pasienService.getAllJadwalKunjungan(userId, limit, offset);
        res.status(200).json(successResponse('Jadwal kunjungan berhasil diambil', result));
    } catch (error) {
        res.status(500).json(errorResponse(error.message));
    }
}

// exports.getNotifyPatient = async (req, res) => {
//     try {
//         const userId = req.user.id;
//         const result = await pasienService.getNotifyPatient(userId);
//         res.status(200).json(successResponse('Notifikasi ke pasien berhasil diambil', result));
//     } catch (error) {
//         res.status(500).json(errorResponse(error.message));
//     }
// }

exports.updateJadwalKunjungan = async (req, res) => {
    try {
        const jadwalKunjunganId = req.params.id;
        const status = req.body.status;
        const result = await pasienService.updateJadwalKunjungan(jadwalKunjunganId, status);
        res.status(200).json(successResponse('Jadwal kunjungan berhasil diubah', result));
    } catch (error) {
        res.status(500).json(errorResponse(error.message));
    }
}