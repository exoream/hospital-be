const notifikasiService = require('../../services/admin/notifikasiService');
const { successResponse, errorResponse } = require('../../utils/response');

exports.getAdminNotifikasi = async (req, res) => {
    try {
        const adminId = req.user.id;
        const result = await notifikasiService.getAdminNotifikasi(adminId);
        res.status(200).json(successResponse('Notifikasi admin berhasil diambil', result));
    } catch (err) {
        res.status(err.statusCode || 500).json(errorResponse(err.message));
    }
};

exports.getAdminAllNotifikasi = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const tanggal = req.query.tanggal || '';

        const result = await notifikasiService.getAdminAllNotifikasi(page, limit, tanggal);

        res.status(200).json(successResponse('Notifikasi admin berhasil diambil', result));
    } catch (error) {
        res.status(500).json(errorResponse(error.message));
    }
};


exports.markNotifikasiAdminRead = async (req, res) => {
    try {
        await notifikasiService.markNotifikasiAdminRead();
        res.status(200).json(successResponse('Notifikasi admin ditandai telah dibaca'));
    } catch (err) {
        res.status(err.statusCode || 500).json(errorResponse(err.message));
    }
};
