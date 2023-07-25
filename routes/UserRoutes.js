const express = require('express');
const { fetchUserById, updateUser } = require('../controller/UserController');

const router = express.Router();

// /brand is added in index,js
router
    .get('/own', fetchUserById) 
    .patch('/:id', updateUser); 
    
exports.router = router;  