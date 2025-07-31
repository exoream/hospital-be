const riwayatPasienService = require('../../services/admin/patienManagementService');
const { successResponse, errorResponse } = require('../../utils/response');

exports.getAllRiwayatByPasienId = async (req, res) => {
    try {
        const pasienId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const result = await riwayatPasienService.getAllRiwayatByPasienId(pasienId, limit, offset);
        res.status(200).json(successResponse('Riwayat pasien berhasil diambil', result));
    } catch (error) {
        res.status(500).json(errorResponse(error.message));
    }
};

exports.getAllKonsultasiByPasienId = async (req, res) => {
    try {
        const pasienId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const result = await riwayatPasienService.getAllKonsultasiByPasienId(pasienId, limit, offset);
        res.status(200).json(successResponse('Daftar konsultasi pasien berhasil diambil', result));
    } catch (error) {
        res.status(500).json(errorResponse(error.message));
    }
};

exports.createNotifyPatientWithResult = async (req, res) => {
    try {
        const adminId = req.user.id;
        const riwayatPasienId = req.params.id;
        const data = req.body;
        const result = await riwayatPasienService.createNotifyPatientWithResult(adminId, riwayatPasienId, data);
        res.status(200).json(successResponse('Notifikasi ke pasien berhasil dikirim', result));
    } catch (error) {
        res.status(500).json(errorResponse(error.message));
    }
}

exports.getPasienKonsultasiTerbaru = async (req, res) => {
    try {
        const result = await riwayatPasienService.getPasienKonsultasiTerbaru();
        res.status(200).json(successResponse('Data pasien konsultasi berhasil diambil', result));
    } catch (error) {
        res.status(500).json(errorResponse(error.message));
    }
};

exports.createJadwalKunjungan = async (req, res) => {
    try {
        const result = await riwayatPasienService.createJadwalKunjungan(req.body);
        res.status(201).json(successResponse('Jadwal kunjungan berhasil dibuat', result));
    } catch (error) {
        res.status(500).json(errorResponse(error.message));
    }
};


// exports.createJadwalKunjungan = async (req, res) => {
//     try {
//         const adminId = req.user.id;
//         const data = req.body;
//         const result = await riwayatPasienService.createJadwalKunjungan(adminId, data);
//         res.status(200).json(successResponse('Jadwal kunjungan berhasil dibuat', result));
//     } catch (error) {
//         res.status(500).json(errorResponse(error.message));
//     }
// }

exports.getAllJadwalKunjungan = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const result = await riwayatPasienService.getAllJadwalKunjungan(req.body, limit, offset);
        res.status(200).json(successResponse('Jadwal kunjungan berhasil diambil', result));
    } catch (error) {
        res.status(500).json(errorResponse(error.message));
    }
}

exports.editJadwalKunjungan = async (req, res) => {
    try {
        const adminId = req.user.id;
        const jadwalKunjunganId = req.params.id;
        const data = req.body;
        const result = await riwayatPasienService.editJadwalKunjungan(adminId, jadwalKunjunganId, data);
        res.status(200).json(successResponse('Jadwal kunjungan berhasil diubah', result));
    } catch (error) {
        res.status(500).json(errorResponse(error.message));
    }
}

exports.deleteJadwalKunjungan = async (req, res) => {
    try {
        const jadwalKunjunganId = req.params.id;
        const result = await riwayatPasienService.deleteJadwalKunjungan(jadwalKunjunganId);
        res.status(200).json(successResponse('Jadwal kunjungan berhasil dihapus', result));
    } catch (error) {
        res.status(500).json(errorResponse(error.message));
    }
}