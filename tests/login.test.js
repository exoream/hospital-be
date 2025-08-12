const request = require('supertest');
const app = require('../index');
const pool = require('../config/db');
const bcrypt = require('bcrypt');

let connection;
let dummyUser = {
    username: 'testuser_login',
    password: 'password123'
};

beforeAll(async () => {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    pool.query = (...args) => connection.query(...args);

    const hashedPassword = await bcrypt.hash(dummyUser.password, 10);

    await connection.query(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [dummyUser.username, hashedPassword]
    );
});

afterAll(async () => {
    await connection.rollback();
    connection.release();
    await pool.end();
});

describe('Login API - Equivalence Partitioning (Dummy Data)', () => {
    test('1. Username dan password valid → Login berhasil', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: dummyUser.username, password: dummyUser.password });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('message', 'Login berhasil');
        expect(res.body.data).toHaveProperty('token');
        expect(typeof res.body.data.token).toBe('string');
    });

    test('2. Username benar, password salah → Error', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: dummyUser.username, password: 'wrongpass' });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('Username atau password salah');
    });

    test('3. Username salah, password benar → Error', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'wronguser', password: dummyUser.password });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('Username atau password salah');
    });

    test('4. Username kosong, password terisi → Error', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: '', password: dummyUser.password });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Username dan password wajib diisi');
    });

    test('5. Username terisi, password kosong → Error', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: dummyUser.username, password: '' });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Username dan password wajib diisi');
    });

    test('6. Username dan password kosong → Error', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: '', password: '' });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Username dan password wajib diisi');
    });
});
