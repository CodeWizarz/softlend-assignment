const offerService = require('../services/offerService');

const offerController = {
  create(req, res, next) {
    try {
      const result = offerService.create(parseInt(req.params.id), req.body);
      return res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  list(req, res, next) {
    try {
      const { locked } = req.query;
      const result = offerService.list(parseInt(req.params.id), { locked });
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  updateStatus(req, res, next) {
    try {
      const result = offerService.updateStatus(
        parseInt(req.params.id),
        req.body.status
      );
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  calculateEMI(req, res, next) {
    try {
      const result = offerService.calculateEMI(parseInt(req.params.id));
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = offerController;
