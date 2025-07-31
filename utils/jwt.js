// utils/jwt.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

exports.encode = (payload, expirationTime = null) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: expirationTime });
};

exports.decode = (token) => {
    return jwt.verify(token, JWT_SECRET);
};
