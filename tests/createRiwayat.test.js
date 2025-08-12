// tests/createRiwayat.test.js
const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../index');
const pool = require('../config/db');

let adminToken;
let pasienToken;
let connection;

beforeAll(async () => {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    pool.query = (...args) => connection.query(...args);

    // Buat akun pasien dummy
    const hashedPassword = await bcrypt.hash('test1234', 10);

    const [userResult] = await connection.query(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        ['PasienTestRiwayat', hashedPassword, 'pasien']
    );

    const userId = userResult.insertId;

    await connection.query(
        'INSERT INTO pasiens (user_id, nik, tanggal_lahir, jenis_kelamin, alamat, nama_lengkap) VALUES (?, ?, ?, ?, ?, ?)',
        [
            userId,
            '7309026102489998',
            '1950-01-01',
            'P',
            'Alamat pasien untuk uji riwayat',
            'Pasien Uji Riwayat'
        ]
    );

    //Token pasien mock
    pasienToken = jwt.sign(
        { id: userId, username: 'PasienTestRiwayat', role: 'pasien' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
    );
});

afterAll(async () => {
    await connection.rollback();
    connection.release();
    await pool.end();
});
describe('API Create Riwayat Pasien - Equivalence Partitioning', () => {

    test('1. Semua field valid → Data tersimpan', async () => {
        const res = await request(app)
            .post('/api/pasien/riwayat')
            .set('Authorization', `Bearer ${pasienToken}`)
            .send({
                keluhan: 'Sakit kepala 3 hari',
                alamat: 'Dusun Campulili, Desa Sawaru'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toMatch(/berhasil/i);
        expect(res.body.data).toHaveProperty('keluhan', 'Sakit kepala 3 hari');
    });

    test('2. Field keluhan kosong → Error', async () => {
        const res = await request(app)
            .post('/api/pasien/riwayat')
            .set('Authorization', `Bearer ${pasienToken}`)
            .send({
                keluhan: '',
                alamat: 'Dusun Campulili, Desa Sawaru'
            });

        expect(res.statusCode).toBe(500);
        expect(res.body.message).toMatch('Keluhan wajib diisi');
    });

    test('3. Field alamat kosong → Error', async () => {
        const res = await request(app)
            .post('/api/pasien/riwayat')
            .set('Authorization', `Bearer ${pasienToken}`)
            .send({
                keluhan: 'Sakit kepala',
                alamat: ''
            });

        expect(res.statusCode).toBe(500);
        expect(res.body.message).toMatch('Alamat wajib diisi');
    });

    test('4. Semua field kosong → Error', async () => {
        const res = await request(app)
            .post('/api/pasien/riwayat')
            .set('Authorization', `Bearer ${pasienToken}`)
            .send({
                keluhan: '',
                alamat: ''
            });

        expect(res.statusCode).toBe(500);
        expect(res.body.message).toMatch('Keluhan dan alamat wajib diisi');
    });

});
