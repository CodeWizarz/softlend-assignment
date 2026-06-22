const customerService = require('../services/customerService');
const gapService = require('../services/gapService');
const offerService = require('../services/offerService');

const customerController = {
  create(req, res, next) {
    try {
      const result = customerService.create(req.body);
      return res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  updateCreditScore(req, res, next) {
    try {
      const result = customerService.updateCreditScore(
        parseInt(req.params.id),
        req.body.cibil_score
      );
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  getCreditProfile(req, res, next) {
    try {
      const result = gapService.getCreditProfile(parseInt(req.params.id));
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  getImprovementSummary(req, res, next) {
    try {
      const result = gapService.getImprovementSummary(parseInt(req.params.id));
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = customerController;
