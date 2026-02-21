const express = require('express');
const router = express.Router();
const { getMasterData, addMasterData } = require('../controllers/masterController');

router.route('/:type')
    .get(getMasterData)
    .post(addMasterData);

module.exports = router;
