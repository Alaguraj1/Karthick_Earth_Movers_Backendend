const express = require('express');
const router = express.Router();
const {
    getProductions,
    createProduction,
    updateProduction,
    deleteProduction,
    getOperatorsForMachine
} = require('../controllers/machineProductionController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect); // All production routes are protected

router.route('/')
    .get(getProductions)
    .post(createProduction);

router.route('/:id')
    .put(updateProduction)
    .delete(deleteProduction);

router.get('/operators/:machineId', getOperatorsForMachine);

module.exports = router;
