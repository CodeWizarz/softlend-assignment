const { Router } = require('express');
const gapController = require('../controllers/gapController');
const validate = require('../middleware/validate');
const validators = require('../validators/customerValidators');

const router = Router();

router.patch('/:id/resolve', validators.resolveGap, validate, gapController.resolveGap);

module.exports = router;
