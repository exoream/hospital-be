const db = require('../../config/db');
const { hashPassword } = require('../../utils/hashing');
const { ResponseError } = require('../../utils/response');
const Validation = require("../../utils/validations/validation");
const PasienValidation = require("../../utils/validations/adminValidation");

exports.createPasien = async (data) => {
    try {
        // Validasi input
        const validData = Validation.validate(PasienValidation.createPasienSchema, data);
        const { username, password, nik, tanggal_lahir, jenis_kelamin, alamat, nama_lengkap } = validData;


        // Cek apakah username sudah ada
        const [existingUser] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            throw new Error('Username sudah terdaftar');
        }

        const [existingNik] = await db.query('SELECT * FROM pasiens WHERE nik = ?', [nik]);
        if (existingNik.length > 0) {
            throw new Error('NIK sudah terdaftar');
        }

        const hashedPassword = await hashPassword(password);

        const [result] = await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);

        if (!result || !result.insertId) {
            throw new Error('Gagal menyimpan pengguna baru');
        }

        const [pasien] = await db.query('INSERT INTO pasiens (user_id, nik, tanggal_lahir, jenis_kelamin, alamat, nama_lengkap) VALUES (?, ?, ?, ?, ?, ?)', [result.insertId, nik, tanggal_lahir, jenis_kelamin, alamat, nama_lengkap]);
        return {
            id: result.insertId,
            username: username
        };
    } catch (error) {
        throw new ResponseError(500, 'Gagal membuat pasien: ' + error.message);
    }
}


exports.editPasien = async (id, data) => {
    try {
        // const { username, password, alamat, nama_lengkap } = data;
        // // Update users table if username or password is provided
        // if (username || password) {
        //     let updateUserQuery = 'UPDATE users SET ';
        //     const updateValues = [];
        //     if (username) {
        //         updateUserQuery += 'username = ?';
        //         updateValues.push(username);
        //     }
        //     if (password) {
        //         updateUserQuery += (updateValues.length ? ', ' : '') + 'password = ?';
        //         updateValues.push(await hashPassword(password)); // Hash the new password
        //     }
        //     updateUserQuery += ' WHERE id = ?';
        //     updateValues.push(id); // Assuming id is the user id

        //     await db.query(updateUserQuery, updateValues);
        // }

        const validData = Validation.validate(PasienValidation.updatePasienSchema, data);
        const { nik, tanggal_lahir, jenis_kelamin, alamat, nama_lengkap } = validData;

        // Update pasiens table only with provided fields
        let updatePasienQuery = 'UPDATE pasiens SET ';
        const pasienValues = [];
        const updateFields = [];

        if (nik) {
            updateFields.push('nik = ?');
            pasienValues.push(nik);
        }
        if (tanggal_lahir) {
            updateFields.push('tanggal_lahir = ?');
            pasienValues.push(tanggal_lahir);
        }
        if (jenis_kelamin) {
            updateFields.push('jenis_kelamin = ?');
            pasienValues.push(jenis_kelamin);
        }
        if (alamat) {
            updateFields.push('alamat = ?');
            pasienValues.push(alamat);
        }
        if (nama_lengkap) {
            updateFields.push('nama_lengkap = ?');
            pasienValues.push(nama_lengkap);
        }

        // Only proceed if there are fields to update
        if (updateFields.length > 0) {
            updatePasienQuery += updateFields.join(', ') + ' WHERE user_id = ?';
            pasienValues.push(id); // Assuming `id` is the pasien's user_id

            await db.query(updatePasienQuery, pasienValues);
        }
        return null;
    } catch (error) {
        throw error instanceof ResponseError
            ? error
            : new ResponseError(500, 'Gagal mengubah data pasien: ' + error.message);
    }
}


exports.getAllPasien = async (limit, offset, search, page) => {
    try {
        const searchTerm = `%${search}%`;

        // Hitung total data yang cocok untuk pagination
        const [[{ total }]] = await db.query(`
            SELECT COUNT(*) as total
            FROM users 
            INNER JOIN pasiens ON users.id = pasiens.user_id 
            WHERE pasiens.nama_lengkap LIKE ?
        `, [searchTerm]);

        // Ambil data pasien sesuai pencarian dan pagination
        const [result] = await db.query(`
            SELECT 
                users.id, 
                users.username, 
                users.created_at, 
                pasiens.nik, 
                pasiens.nama_lengkap, 
                pasiens.tanggal_lahir, 
                pasiens.jenis_kelamin, 
                pasiens.alamat 
            FROM users 
            INNER JOIN pasiens ON users.id = pasiens.user_id 
            WHERE pasiens.nama_lengkap LIKE ?
            ORDER BY users.created_at DESC
            LIMIT ? OFFSET ?
        `, [searchTerm, limit, offset]);

        return {
            data: result,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                nextPage: page * limit < total ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null
            }
        };
    } catch (error) {
        throw new ResponseError(500, 'Gagal mengambil data pasien: ' + error.message);
    }
};


exports.getPasienById = async (id) => {
    try {
        const [result] = await db.query(`
            SELECT 
                users.id, 
                users.username, 
                users.role, 
                users.created_at, 
                pasiens.nik, 
                pasiens.nama_lengkap, 
                pasiens.tanggal_lahir, 
                pasiens.jenis_kelamin, 
                pasiens.alamat 
            FROM users 
            INNER JOIN pasiens ON users.id = pasiens.user_id 
            WHERE users.id = ?
            `, [id]);

        if (result.length === 0) {
            throw new ResponseError(404, 'Data pasien tidak ditemukan');
        }

        return result;
    } catch (error) {
        throw error instanceof ResponseError
            ? error
            : new ResponseError(500, 'Gagal mengambil data pasien: ' + error.message);
    }
}

