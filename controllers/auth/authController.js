const JWT = require('../../utils/jwt');
const db = require('../../config/db');
const { verifyPassword } = require('../../utils/hashing');
const { successResponse } = require('../../utils/response');

exports.login = async (req, res) => {
    const { username, password } = req.body;
    console.log('Request body:', req.body);

    const [user] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    if (!user || user.length === 0) {
        return res.status(401).json({ message: 'Username tidak ditemukan' });
    }

    const isPasswordValid = await verifyPassword(password, user[0].password);


    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Password tidak sesuai' });
    }

    const token = JWT.encode({ id: user[0].id, username: user[0].username, role: user[0].role }, '24h');

    res.status(200).json(successResponse('Login successful', { token: token }));
}
