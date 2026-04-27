const axios = require('axios');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const generateToken = require('../utils/generateToken');
const User = require('./User');
const RefreshToken = require('./RefreshToken');

const redirectGitHub = async (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: 'http://localhost:3000/auth/github/callback',
        scope: 'user:email',
    })

    res.redirect(`https://github.com/login/oauth/authorize?${params}`)
}

const callbackGitHub = async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) return res.status(400).json({ message: 'Missing code' });

        const tokenResponse = await axios.post(
            'https://github.com/login/oauth/access_token',
            {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: process.env.GITHUB_REDIRECT_URL,
            },
            { headers : { Accept: 'application/json' } }
        )

        const githubAccessToken = tokenResponse.data.access_token;
        if (!githubAccessToken) return res.status(401).json({ message: 'Failed to obtain GitHub access token' });

        const userResponse = await axios.get('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${githubAccessToken}`,
                Accept: 'application/json',
            },
        });

        const githubUser = userResponse.data;

        let email = githubUser.email;
        if (!email) {
            const emailResponse = await axios.get('https://api.github.com/user/emails', {
                headers: {
                    Authorization: `Bearer ${githubAccessToken}`,
                    Accept: 'application/json',
                },
            });

            const primary = emailResponse.data.find((e) => e.primary && e.verified);
            email = primary?.email || null;
        }

        const user = await User.insert({
            name: githubUser.name || githubUser.login,
            email,
            avatar_url: githubUser.avatar_url,
            oauth_provider: 'github',
            oauth_id: String(githubUser.id),
        });

        const { accessToken, refreshToken, jwt_id } = generateToken(user);

        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const expires_at = new Date(Date.now() + process.env.REFRESH_TOKEN_EXPIRES_IN);
        await RefreshToken.create({ user_id: user.id, token: tokenHash, expires_at });

        return res.status(200).json({
            message: 'Github OAuth success',
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        })

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}