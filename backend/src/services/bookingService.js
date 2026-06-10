const { Booking, BookingStatusHistory, Route, Driver, Agency, Sequelize } = require('../models');
const { Op } = Sequelize;

function getValidTransitions() {
  return {
    Pending: ['Confirmed', 'Cancelled'],
    Confirmed: ['On Trip', 'Cancelled'],
    'On Trip': ['Completed'],
    Completed: [],
    Cancelled: [],
  };
}

function isValidTransition(from, to) {
  const transitions = getValidTransitions();
  return transitions[from] && transitions[from].includes(to);
}

async function createBooking(userId, data) {
  // Rule 1: Prevent duplicate booking for exact same route/driver/date
  const existing = await Booking.findOne({
    where: {
      userId,
      routeId: data.routeId,
      driverId: data.driverId,
      travelDate: data.travelDate,
      status: { [Op.notIn]: ['Cancelled'] },
    },
  });
  if (existing) {
    const err = new Error('You already have a booking for this route on this date');
    err.status = 409;
    throw err;
  }

  // Rule 2: Prevent booking on a date that already has an active trip
  const sameDateBooking = await Booking.findOne({
    where: {
      userId,
      travelDate: data.travelDate,
      status: { [Op.notIn]: ['Cancelled', 'Completed'] },
    },
  });
  if (sameDateBooking) {
    const err = new Error(
      `You already have an active booking on ${data.travelDate}. ` +
      `Please complete or cancel your existing trip before booking another on the same date.`
    );
    err.status = 409;
    throw err;
  }

  const route = await Route.findByPk(data.routeId);
  if (!route) {
    const err = new Error('Route not found');
    err.status = 404;
    throw err;
  }
  if (!route.available) {
    const err = new Error('This route is currently unavailable');
    err.status = 400;
    throw err;
  }
  if (data.seatCount > route.capacity) {
    const err = new Error(`Seat count exceeds vehicle capacity of ${route.capacity}`);
    err.status = 400;
    throw err;
  }

  const driver = await Driver.findByPk(data.driverId);
  if (!driver) {
    const err = new Error('Driver not found');
    err.status = 404;
    throw err;
  }

  const booking = await Booking.create({
    userId,
    routeId: data.routeId,
    driverId: data.driverId,
    seatCount: data.seatCount,
    travelDate: data.travelDate,
    status: 'Pending',
  });

  await BookingStatusHistory.create({
    bookingId: booking.id,
    fromStatus: 'Pending',
    toStatus: 'Pending',
    changedBy: userId,
  });

  return booking;
}

async function getUserBookings(userId, page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  const { count, rows } = await Booking.findAndCountAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return {
    data: rows,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    totalItems: count,
  };
}

async function getBookingById(userId, bookingId) {
  const booking = await Booking.findOne({
    where: { id: bookingId, userId },
    include: [
      {
        model: BookingStatusHistory,
      },
      {
        model: Route,
      },
      {
        model: Driver,
        include: [{ model: Agency }],
      },
    ],
  });
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }
  return booking;
}

async function cancelBooking(userId, bookingId, isAdmin = false) {
  const where = isAdmin ? { id: bookingId } : { id: bookingId, userId };
  const booking = await Booking.findOne({ where });
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }
  if (booking.status === 'Cancelled') {
    const err = new Error('Booking is already cancelled');
    err.status = 400;
    throw err;
  }
  if (!isValidTransition(booking.status, 'Cancelled')) {
    const err = new Error(`Cannot cancel a booking with status ${booking.status}`);
    err.status = 400;
    throw err;
  }

  const prevStatus = booking.status;
  booking.status = 'Cancelled';
  await booking.save();

  await BookingStatusHistory.create({
    bookingId: booking.id,
    fromStatus: prevStatus,
    toStatus: 'Cancelled',
    changedBy: userId,
  });

  return booking;
}

async function getBookingStatus(bookingId) {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }
  return { id: booking.id, status: booking.status };
}

async function getStatusHistory(bookingId) {
  const history = await BookingStatusHistory.findAll({
    where: { bookingId },
    order: [['createdAt', 'ASC']],
  });
  return history.map(h => ({
    fromStatus: h.fromStatus,
    toStatus: h.toStatus,
    changedAt: h.createdAt,
  }));
}

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getBookingStatus,
  getStatusHistory,
  isValidTransition,
  getValidTransitions,
};
