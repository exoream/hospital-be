// File: controllers/admin/healthReportController.js

const healthReportService = require('../../services/admin/reportManagementService');
const { successResponse, errorResponse } = require('../../utils/response');

exports.getReportByPasienId = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await healthReportService.getReportByPasienId(id);
        res.status(200).json(successResponse('Laporan individu berhasil diambil', result));
    } catch (error) {
        res.status(error.statusCode || 500).json(errorResponse(error.message));
    }
};

exports.getAnnualReport = async (req, res) => {
    try {
        const { year } = req.params;
        const result = await healthReportService.getAnnualReport(year);
        res.status(200).json(successResponse('Laporan tahunan berhasil diambil', result));
    } catch (error) {
        res.status(error.statusCode || 500).json(errorResponse(error.message));
    }
};

exports.getMonthlyReport = async (req, res) => {
    try {
        const { year, month } = req.params;
        const result = await healthReportService.getMonthlyReport(year, month);
        res.status(200).json(successResponse('Laporan bulanan berhasil diambil', result));
    } catch (error) {
        res.status(error.statusCode || 500).json(errorResponse(error.message));
    }
};
