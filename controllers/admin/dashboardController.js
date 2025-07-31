
const dashboardService = require('../../services/admin/dashboardService');
const { successResponse, errorResponse } = require('../../utils/response');

exports.getDashboardData = async (req, res) => {
    try {
        const result = await dashboardService.getDashboardOverview();
        res.status(200).json(successResponse('Data dashboard berhasil diambil', result));
    } catch (error) {
        res.status(error.statusCode || 500).json(errorResponse(error.message));
    }
};

exports.getKunjunganChart = async (req, res) => {
    try {
        const data = await dashboardService.getKunjunganPerHari();
        res.status(200).json(successResponse('Data chart berhasil diambil', data));
    } catch (error) {
        res.status(500).json(errorResponse('Gagal ambil data chart'));
    }
};