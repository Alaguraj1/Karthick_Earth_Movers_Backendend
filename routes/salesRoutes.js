const express = require('express');
const router = express.Router();
const {
    getSales,
    getSale,
    addSale,
    updateSale,
    deleteSale,
    addPayment,
    getPendingPayments
} = require('../controllers/salesController');

// Pending payments report - must be before /:id
router.get('/pending-payments', getPendingPayments);

router.route('/').get(getSales).post(addSale);
router.route('/:id').get(getSale).put(updateSale).delete(deleteSale);
router.post('/:id/payment', addPayment);

module.exports = router;
