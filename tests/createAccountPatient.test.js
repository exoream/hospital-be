const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');
const pool = require('../config/db');

let adminToken;
let connection;

beforeAll(async () => {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    pool.query = (...args) => connection.query(...args);

    // Token mock
    adminToken = jwt.sign(
        {
            id: 1,
            username: 'testuser_admin',
            role: 'admin'
        },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
    );
});

afterAll(async () => {
    await connection.rollback();
    connection.release();
    await pool.end();
});


describe('API Buat Akun Pasien - Equivalence Partitioning', () => {

    test('1. NIK kurang dari 16 digit → Error', async () => {
        const res = await request(app)
            .post('/api/admin/pasien')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                username: 'TestNIKShort',
                password: '123123123',
                nama_lengkap: 'Test User',
                nik: '73090261024800',
                tanggal_lahir: '1956-04-02',
                jenis_kelamin: 'P',
                alamat: 'Alamat lengkap minimal 10 karakter'
            });

        expect(res.statusCode).toBe(500);
        expect(res.body.message).toBe('Gagal membuat pasien: NIK harus terdiri dari 16 digit angka');
    });

    test('2. Usia kurang dari 60 tahun → Error', async () => {
        const res = await request(app)
            .post('/api/admin/pasien')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                username: 'YoungUser',
                password: '123123123',
                nama_lengkap: 'Young Person',
                nik: '7309026102489999',
                tanggal_lahir: '1986-01-01',
                jenis_kelamin: 'P',
                alamat: 'Alamat lengkap minimal 10 karakter'
            });

        expect(res.statusCode).toBe(500);
        expect(res.body.message).toBe('Gagal membuat pasien: Pasien harus berusia minimal 60 tahun');
    });

    test('3. Field wajib kosong (password kosong) → Error', async () => {
        const res = await request(app)
            .post('/api/admin/pasien')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                username: 'NoPasswordUser',
                password: '',
                nama_lengkap: 'Test User',
                nik: '7309026102477777',
                tanggal_lahir: '1956-04-02',
                jenis_kelamin: 'P',
                alamat: 'Alamat lengkap minimal 10 karakter'
            });

        expect(res.statusCode).toBe(500);
        expect(res.body.message).toBe('Gagal membuat pasien: Password minimal 6 karakter');
    });

    test('4. Semua field kosong → Error', async () => {
        const res = await request(app)
            .post('/api/admin/pasien')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({});

        expect(res.statusCode).toBe(500);
        expect(res.body.message).toMatch("Gagal membuat pasien: Required");
    });

    test('5. Semua field valid → Akun berhasil dibuat', async () => {
        const res = await request(app)
            .post('/api/admin/pasien')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                username: 'HamsiahTest',
                password: '123123123',
                nama_lengkap: 'HJ. HAMSIAH',
                nik: '7309026102480001',
                tanggal_lahir: '1956-04-02',
                jenis_kelamin: 'P',
                alamat: 'Dusun Campulili, Desa Sawaru'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toMatch("Akun pasien berhasil ditambahkan");
    });

    test('6. Username sudah terdaftar → Error', async () => {
        const res = await request(app)
            .post('/api/admin/pasien')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                username: 'HamsiahTest',
                password: '123123123',
                nama_lengkap: 'HJ. HAMSIAH',
                nik: '7309026102455555',
                tanggal_lahir: '1956-04-02',
                jenis_kelamin: 'P',
                alamat: 'Alamat lengkap minimal 10 karakter'
            });

        expect(res.statusCode).toBe(500);
        expect(res.body.message).toMatch("Gagal membuat pasien: Username sudah terdaftar");
    });
});
