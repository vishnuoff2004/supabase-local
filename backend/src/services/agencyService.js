const { Driver, Booking, User, Route, Agency, Sequelize } = require('../models');
const { Op } = Sequelize;

async function addDriver(userId, driverId) {
  const agency = await Agency.findOne({ where: { createdBy: userId } });
  if (!agency) {
    const err = new Error('Agency not found');
    err.status = 404;
    throw err;
  }
  const driver = await Driver.findByPk(driverId);
  if (!driver) {
    const err = new Error('Driver not found');
    err.status = 404;
    throw err;
  }
  if (driver.agencyId && driver.agencyId !== agency.id) {
    const err = new Error('Driver already belongs to another agency');
    err.status = 409;
    throw err;
  }
  driver.agencyId = agency.id;
  await driver.save();
  return driver;
}

async function removeDriver(userId, driverId) {
  const agency = await Agency.findOne({ where: { createdBy: userId } });
  if (!agency) {
    const err = new Error('Agency not found');
    err.status = 404;
    throw err;
  }
  const driver = await Driver.findOne({ where: { id: driverId, agencyId: agency.id } });
  if (!driver) {
    const err = new Error('Driver not found in your agency');
    err.status = 404;
    throw err;
  }
  const activeBookings = await Booking.count({
    where: { driverId: driver.id, status: { [Op.in]: ['Confirmed', 'On Trip'] } },
  });
  if (activeBookings > 0) {
    const err = new Error('Cannot remove driver with active confirmed bookings');
    err.status = 409;
    throw err;
  }
  await Booking.update(
    { status: 'Cancelled', cancelReason: 'Driver removed from agency' },
    { where: { driverId: driver.id, status: 'Pending' } }
  );
  driver.agencyId = null;
  await driver.save();
  return { message: 'Driver removed from agency' };
}

async function getDrivers(userId, page = 1, limit = 20) {
  const agency = await Agency.findOne({ where: { createdBy: userId } });
  if (!agency) {
    return { data: [], page, limit, totalPages: 0, totalItems: 0 };
  }
  const offset = (page - 1) * limit;
  const { count, rows } = await Driver.findAndCountAll({
    where: { agencyId: agency.id },
    limit,
    offset,
  });
  return { data: rows, page, limit, totalPages: Math.ceil(count / limit), totalItems: count };
}

async function getBookings(userId, filters = {}) {
  const agency = await Agency.findOne({ where: { createdBy: userId } });
  if (!agency) {
    return { data: [] };
  }
  const driverIds = await Driver.findAll({ where: { agencyId: agency.id }, attributes: ['id'] });
  const ids = driverIds.map(d => d.id);
  const where = { driverId: { [Op.in]: ids } };
  if (filters.status) where.status = filters.status;
  if (filters.fromDate && filters.toDate) {
    where.travelDate = { [Op.between]: [filters.fromDate, filters.toDate] };
  }
  const bookings = await Booking.findAll({
    where,
    include: [{ model: User, attributes: ['name'] }, { model: Driver, attributes: ['name'] }, { model: Route }],
    order: [['createdAt', 'DESC']],
  });
  const data = bookings.map(b => ({
    bookingId: b.id,
    travelerName: b.User ? b.User.name : null,
    route: b.Route ? `${b.Route.source} → ${b.Route.destination}` : null,
    driverName: b.Driver ? b.Driver.name : null,
    status: b.status,
    fare: b.Route ? b.Route.fare : null,
  }));
  return { data };
}

module.exports = { addDriver, removeDriver, getDrivers, getBookings };
