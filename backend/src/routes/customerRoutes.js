const { Router } = require('express');
const customerController = require('../controllers/customerController');
const gapController = require('../controllers/gapController');
const offerController = require('../controllers/offerController');
const validate = require('../middleware/validate');
const validators = require('../validators/customerValidators');

const router = Router();

router.post('/', validators.createCustomer, validate, customerController.create);
router.post('/:id/credit-score', validators.updateCreditScore, validate, customerController.updateCreditScore);
router.post('/:id/credit-gaps', validators.addCreditGap, validate, gapController.addGap);
router.get('/:id/credit-profile', validators.customerIdParam, validate, customerController.getCreditProfile);
router.get('/:id/improvement-summary', validators.customerIdParam, validate, customerController.getImprovementSummary);
router.post('/:id/offers', validators.createOffer, validate, offerController.create);
router.get('/:id/offers', validators.customerIdParam, validate, offerController.list);

module.exports = router;
