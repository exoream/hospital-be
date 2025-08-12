const JWT = require('../../utils/jwt');
const db = require('../../config/db');
const { verifyPassword } = require('../../utils/hashing');
const { successResponse, errorResponse } = require('../../utils/response');

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json(errorResponse('Username dan password wajib diisi'));
        }

        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

        if (!rows || rows.length === 0) {
            return res.status(401).json(errorResponse('Username atau password salah'));
        }

        const user = rows[0];

        const isPasswordValid = await verifyPassword(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json(errorResponse('Username atau password salah'));
        }

        const token = JWT.encode(
            { id: user.id, username: user.username, role: user.role },
            '24h'
        );

        return res.status(200).json(successResponse('Login berhasil', { token }));
    } catch (err) {
        console.error(err);
        return res.status(500).json(errorResponse('Terjadi kesalahan pada server'));
    }
};
