require('dotenv').config();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('./models/User');

const generateToken = (user) => {
    const jwt_id = uuidv4();
    const accessToken = jwt.sign(
        { sub: user.id, email: user.email, jwt_id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const refreshToken =  uuidv4()
    return { accessToken, refreshToken };
};

module.exports = generateToken;