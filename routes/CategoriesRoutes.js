const express = require('express');
const { fetchCategories, createCategory } = require('../controller/CategoryController');

const router = express.Router();

// /categories is added in index,js
router
    .get('/', fetchCategories)
    .post('/', createCategory);


exports.router = router; 