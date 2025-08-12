const express = require('express');
require('dotenv').config();
const cors = require('cors');
const authRoutes = require('./routes/auth/authRoutes');
const authenticate = require('./utils/middleware/authMiddleware');
const authorizeRole = require('./utils/middleware/authorizeRole');
const adminRoutes = require('./routes/admin/adminRoutes');
const pasienRoutes = require('./routes/pasien/pasienRoutes');

const app = express();
app.use(
  cors({
    origin: "https://hospital-web-gilt-beta.vercel.app",
    credentials: true,
  })
);

app.use(express.json());

//public routes
app.use('/api/auth', authRoutes);

//private routes
app.use('/api/admin', authenticate, authorizeRole(['admin']), adminRoutes);
app.use('/api/pasien', authenticate, authorizeRole(['admin', 'pasien']), pasienRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

if (require.main === module) {
  app.listen(3000, () => {
    console.log(`Server is running on port 3000`);
  });
}

module.exports = app;