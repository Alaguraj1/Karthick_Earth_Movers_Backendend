const express = require('express');
const router = express.Router();
const { getExpenses, addExpense, deleteExpense, updateExpense } = require('../controllers/expenseController');

router.route('/')
    .get(getExpenses)
    .post(addExpense);

router.route('/:id')
    .put(updateExpense)
    .delete(deleteExpense);

module.exports = router;
