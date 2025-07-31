const notifikasiService = require('../../services/pasien/notifikasiService');
const { successResponse, errorResponse } = require('../../utils/response');

exports.getUserNotifikasi = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await notifikasiService.getUserNotifikasi(userId);
        res.status(200).json(successResponse('Notifikasi pasien berhasil diambil', result));
    } catch (err) {
        res.status(err.statusCode || 500).json(errorResponse(err.message));
    }
};

exports.getUserAllNotifikasi = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const tanggal = req.query.tanggal || '';

        const result = await notifikasiService.getUserAllNotifikasi(userId, page, limit, tanggal);
        res.status(200).json(successResponse('Notifikasi pasien berhasil diambil', result));
    } catch (error) {
        res.status(error.statusCode || 500).json(errorResponse(error.message));
    }
};


exports.markUserNotifikasiRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await notifikasiService.markUserNotifikasiRead(userId);
        res.status(200).json(successResponse('Notifikasi pasien ditandai telah dibaca'));
    } catch (err) {
        res.status(err.statusCode || 500).json(errorResponse(err.message));
    }
};