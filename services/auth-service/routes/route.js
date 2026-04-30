require('dotenv').config();
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const oauthController = require('../controllers/oauthController');
const checkBlacklist = require('../utils/checkBlacklist');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/whoami', checkBlacklist, authController.whoami);

router.get('/github', oauthController.redirectGitHub);
router.get('/github/callback', oauthController.callbackGitHub);

module.exports = router;