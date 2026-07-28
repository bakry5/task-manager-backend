const express = require('express');
const { signupValidator, loginValidator } = require('../utils/validators/authValidator');
const authService = require('../services/authService');

const router = express.Router();

router.post('/signup', signupValidator, authService.signup);
router.post('/login', loginValidator, authService.login);
router.post('/logout', authService.logout);
router.get('/me', authService.protect, authService.getMe);

module.exports = router;
