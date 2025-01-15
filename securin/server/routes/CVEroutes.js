const express = require('express');
const router = express.Router();
const cveController = require('../controllers/cveController');

// Define routes
router.get('/list', cveController.getCVEsList);
router.get('/:id', cveController.getCVEById);

module.exports = router;