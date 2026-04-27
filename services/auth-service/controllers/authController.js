const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const generateToken = require('./generateToken');
const User = require('./User');
const RefreshToken = require('./RefreshToken');
const BlacklistedToken = require('./BlacklistedToken');

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Missing required fields!' });
        }

        const exist = await User.findByEmail(email);
        if (exist) return res.status(409).json({ message: 'Email already exists' })

        const password_hashed = await bcrypt.hash(password, 10);
        const id = User.create({ name, email, password_hashed });
        const user = await User.findById(id);

        const { accessToken, refreshToken } = generateToken(user);
        
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const expires_at = new Date(Date.now() + process.env.REFRESH_TOKEN_EXPIRES_IN);
        await RefreshToken.create({ user_id: user.id, token: tokenHash, expires_at });

        return res.status(201).json({ 
            message: 'User created successfully', 
            access_token: accessToken, 
            refresh_token: refreshToken,
            user: { id: user_id, name: user.name, email: user.email }, 
         });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password){
            return res.status(400).json({ message: 'Missing required fields!' });
        }

        const user = await User.findByEmail(email);
        if (!user || !user.password_hashed) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password_hashed);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const { accessToken, refreshToken } = generateToken(user);
        
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const expires_at = new Date(Date.now() + process.env.REFRESH_TOKEN_EXPIRES_IN);
        await RefreshToken.create({ user_id: user.id, token: tokenHash, expires_at });

        return res.status(200).json({ 
            message: 'Login success', 
            access_token: accessToken, 
            refresh_token: refreshToken,
            user: { id: user_id, name: user.name, email: user.email }, 
         });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const refresh = async (req, res) => {
    try {
        const { refresh_token } = req.body;
        if (!refresh_token) return res.status(400).json({ message: 'Missing refresh token' });

        const tokenHash = crypto.createHash('sha256').update(refresh_token).digest('hex');
        const token = await RefreshToken.findbyToken(tokenHash);
        if (!token) return res.status(401).json({ message: 'Invalid refresh token' });

        const user = await User.findById(token.user_id);
        const { accessToken, refreshToken } = generateToken(user);

        const revoke = await RefreshToken.revoke(tokenHash);
        const newHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const expires_at = new Date(Date.now() + process.env.REFRESH_TOKEN_EXPIRES_IN);
        await RefreshToken.create({ user_id: user.id, token: newHash, expires_at });

        return res.status(200).json({
            access_token: accessToken,
            refresh_token: refreshToken
        })

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const logout = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        await TokenBlacklist.create({ jwt_id: decoded.jwt_id, expires_at: new Date(decoded.exp * 1000) });
        const { refresh_token } = req.body;
        if (refresh_token) {
            const tokenHash = crypto.createHash('sha256').update(refresh_token).digest('hex');
            await RefreshToken.revoke(tokenHash);
        }

        return res.status(200).json({ message: 'Logout success' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const whoami = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        return res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            avatar_url: user.avatar_url,
            oauth_provider: user.oauth_provider,
         });
         
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}