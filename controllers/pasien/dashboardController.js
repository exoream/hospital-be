const dashboardService = require('../../services/pasien/dashboardService');
const { successResponse, errorResponse } = require('../../utils/response');

exports.getDashboardDataPasien = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json(errorResponse('Unauthorized'));
        }

        const result = await dashboardService.getDashboardPasienOverview(userId);
        res.status(200).json(successResponse('Data dashboard pasien berhasil diambil', result));
    } catch (error) {
        res.status(error.statusCode || 500).json(errorResponse(error.message));
    }
};