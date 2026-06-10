const driverService = require('../services/driverService');
const agencyRequestService = require('../services/agencyRequestService');

async function createProfile(req, res, next) {
  try {
    if (!req.body.licenseNo) {
      return res.status(400).json({ message: 'License number is required' });
    }
    const driver = await driverService.createProfile(req.user.id, req.body);
    res.status(201).json(driver);
  } catch (err) {
    if (err.status === 409) return res.status(409).json({ message: err.message });
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const driver = await driverService.updateProfile(req.user.id, req.body);
    res.json(driver);
  } catch (err) {
    next(err);
  }
}

async function createRoute(req, res, next) {
  try {
    const route = await driverService.createRoute(req.user.id, req.body);
    res.status(201).json(route);
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ message: err.message });
    next(err);
  }
}

async function setRouteAvailability(req, res, next) {
  try {
    const route = await driverService.setRouteAvailability(req.user.id, req.params.id, req.body.available);
    res.json(route);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ message: err.message });
    next(err);
  }
}

async function acceptBooking(req, res, next) {
  try {
    const booking = await driverService.acceptBooking(req.user.id, req.params.id);
    res.json(booking);
  } catch (err) {
    if (err.status === 400 || err.status === 403 || err.status === 404) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

async function rejectBooking(req, res, next) {
  try {
    const booking = await driverService.rejectBooking(req.user.id, req.params.id, req.body.reason);
    res.json(booking);
  } catch (err) {
    if (err.status === 400 || err.status === 403 || err.status === 404) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

async function updateTripStatus(req, res, next) {
  try {
    const booking = await driverService.updateTripStatus(req.user.id, req.params.id, req.body.status);
    res.json(booking);
  } catch (err) {
    if (err.status === 400 || err.status === 403 || err.status === 404 || err.status === 409) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

async function setAvailability(req, res, next) {
  try {
    const driver = await driverService.setOverallAvailability(req.user.id, req.body.available);
    res.json(driver);
  } catch (err) {
    next(err);
  }
}

async function getMyAgencyStatus(req, res, next) {
  try {
    const status = await agencyRequestService.getMyAgencyStatus(req.user.id);
    res.json(status);
  } catch (err) { next(err); }
}

async function listAgencies(req, res, next) {
  try {
    const agencies = await agencyRequestService.listAgencies(req.user.id);
    res.json(agencies);
  } catch (err) { next(err); }
}

async function sendJoinRequest(req, res, next) {
  try {
    const result = await agencyRequestService.sendJoinRequest(req.user.id, req.body.agencyId);
    res.status(201).json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
}

async function cancelJoinRequest(req, res, next) {
  try {
    const result = await agencyRequestService.cancelJoinRequest(req.user.id);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
}

module.exports = {
  createProfile,
  updateProfile,
  createRoute,
  setRouteAvailability,
  acceptBooking,
  rejectBooking,
  updateTripStatus,
  setAvailability,
  getMyAgencyStatus,
  listAgencies,
  sendJoinRequest,
  cancelJoinRequest,
};
