const express = require('express');
require('dotenv').config();
const cors = require('cors');
const authRoutes = require('./routes/auth/authRoutes');
const authenticate = require('./utils/middleware/authMiddleware');
const authorizeRole = require('./utils/middleware/authorizeRole');
const adminRoutes = require('./routes/admin/adminRoutes');
const pasienRoutes = require('./routes/pasien/pasienRoutes');

const app = express();
app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true
}));

app.use(express.json());

//public routes
app.use('/api/auth', authRoutes);

//private routes
app.use('/api/admin', authenticate, authorizeRole(['admin']), adminRoutes);
app.use('/api/pasien', authenticate, authorizeRole(['admin', 'pasien']), pasienRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});