const express = require('express');
const router = express.Router();
const { getIncome, addIncome } = require('../controllers/incomeController');

router.route('/')
    .get(getIncome)
    .post(addIncome);

module.exports = router;
