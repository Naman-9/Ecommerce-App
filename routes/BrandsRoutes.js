const express = require('express');
const { fetchBrands, createBrand } = require('../controller/BrandController');

const router = express.Router();

// /brand is added in index,js
router
    .get('/', fetchBrands)
    .post('/', createBrand);
    
exports.router = router;