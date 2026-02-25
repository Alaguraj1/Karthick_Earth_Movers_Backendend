const express = require('express');
const {
    getTrips,
    getTrip,
    createTrip,
    updateTrip,
    deleteTrip,
    getTripStats,
    convertToSale
} = require('../controllers/tripController');

const router = express.Router();

router.route('/')
    .get(getTrips)
    .post(createTrip);

router.get('/stats', getTripStats);
router.post('/:id/convert-to-sale', convertToSale);

router.route('/:id')
    .get(getTrip)
    .put(updateTrip)
    .delete(deleteTrip);

module.exports = router;
