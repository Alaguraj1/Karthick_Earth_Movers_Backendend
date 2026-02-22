const express = require('express');
const {
    getTrips,
    getTrip,
    createTrip,
    updateTrip,
    deleteTrip,
    getTripStats
} = require('../controllers/tripController');

const router = express.Router();

router.route('/')
    .get(getTrips)
    .post(createTrip);

router.get('/stats', getTripStats);

router.route('/:id')
    .get(getTrip)
    .put(updateTrip)
    .delete(deleteTrip);

module.exports = router;
