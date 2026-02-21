const express = require('express');
const router = express.Router();
const { getMasterData, addMasterData, updateMasterData, deleteMasterData } = require('../controllers/masterController');

router.route('/:type')
    .get(getMasterData)
    .post(addMasterData);

router.route('/:type/:id')
    .put(updateMasterData)
    .delete(deleteMasterData);

module.exports = router;
