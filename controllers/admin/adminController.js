const adminService = require('../../services/admin/adminService');
const { successResponse, errorResponse } = require('../../utils/response');

exports.createPasien = async (req, res) => {
    try {
        const data = req.body;
        const result = await adminService.createPasien(data);
        res.status(201).json(successResponse('Akun pasien berhasil ditambahkan', result));
    } catch (error) {
        res.status(500).json(errorResponse(error.message));
    }
}

exports.editPasien = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const result = await adminService.editPasien(id, data);
        res.status(200).json(successResponse('Data pasien berhasil diperbarui', result));
    } catch (error) {
        res.status(500).json(errorResponse(error.message));
    }
}

exports.getAllPasien = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || ''; // ambil kata kunci pencarian dari query param

        const result = await adminService.getAllPasien(limit, offset, search, page);

        res.status(200).json(successResponse('Data pasien berhasil diambil', result));
    } catch (error) {
        res.status(500).json(errorResponse(error.message));
    }
};

exports.getPasienById = async (req, res) => {
    try {
        const result = await adminService.getPasienById(req.params.id);
        res.status(200).json(successResponse('Data pasien berhasil diambil', result));
    } catch (error) {
        res.status(500).json(errorResponse(error.message));
    }
}



