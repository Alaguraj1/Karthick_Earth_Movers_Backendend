const express = require('express');
const router = express.Router();
const {
    getProductions,
    addProduction,
    updateProduction,
    deleteProduction,
    getStockReport
} = require('../controllers/productionController');

router.get('/', getProductions);
router.post('/', addProduction);
router.put('/:id', updateProduction);
router.delete('/:id', deleteProduction);
router.get('/stock-report', getStockReport);

module.exports = router;
