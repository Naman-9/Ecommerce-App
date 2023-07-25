const express = require('express');
const { addToCart, fetchCartByUser, deleteFromCart, updateCart } = require('../controller/CartController');

const router = express.Router();

// /products is added in index,js
router
    .post('/', addToCart)
    .get('/', fetchCartByUser)
    .delete('/:id', deleteFromCart)
    .patch('/:id', updateCart)
    ;
 


exports.router = router;