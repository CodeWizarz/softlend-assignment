const { Router } = require('express');
const offerController = require('../controllers/offerController');
const gapController = require('../controllers/gapController');
const validate = require('../middleware/validate');
const validators = require('../validators/customerValidators');

const router = Router();

router.patch('/:id/status', validators.updateOfferStatus, validate, offerController.updateStatus);
router.get('/:id/emi', validators.emiParam, validate, offerController.calculateEMI);

module.exports = router;
