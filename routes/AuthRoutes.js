const express = require('express');
const { createUser, loginUser, checkAuth,  resetPasswordRequest, logout, resetPassword} = require('../controller/AuthController');
const passport = require('passport');

const router = express.Router();

router.post('/signup', createUser)
      .post('/login', passport.authenticate('local'), loginUser)
      .get('/logout', logout)
      .get('/check', passport.authenticate('jwt'), checkAuth)
      .post('/reset-password-request', resetPasswordRequest)
      .post('/reset-password', resetPassword)
      ;
exports.router = router;             