const bcrypt = require("bcryptjs");

const SALT_OR_ROUNDS = 10;

exports.hashPassword = (password) => bcrypt.hash(password, SALT_OR_ROUNDS);

exports.verifyPassword = (password, hash) => bcrypt.compare(password, hash);

