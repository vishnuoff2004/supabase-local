const agencyService = require('../services/agencyService');

async function addDriver(req, res, next) {
  try {
    const driver = await agencyService.addDriver(req.user.id, req.body.driverId);
    res.status(201).json(driver);
  } catch (err) {
    if (err.status === 404 || err.status === 409) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

async function removeDriver(req, res, next) {
  try {
    const result = await agencyService.removeDriver(req.user.id, req.params.id);
    res.json(result);
  } catch (err) {
    if (err.status === 404 || err.status === 409) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

async function getDrivers(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await agencyService.getDrivers(req.user.id, page, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getBookings(req, res, next) {
  try {
    const result = await agencyService.getBookings(req.user.id, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { addDriver, removeDriver, getDrivers, getBookings };
