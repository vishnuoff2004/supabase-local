const { Booking, Driver, User, Agency, Route, Sequelize } = require('../models');
const { Op } = Sequelize;

async function getUserDashboard(req, res, next) {
  try {
    const userId = req.user.id;
    const activeBookings = await Booking.count({
      where: { userId, status: { [Op.notIn]: ['Cancelled', 'Completed'] } },
    });
    const totalBookings = await Booking.count({ where: { userId } });
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingTrips = await Booking.findAll({
      where: { userId, travelDate: { [Op.between]: [today.toISOString().split('T')[0], nextWeek.toISOString().split('T')[0]] }, status: { [Op.notIn]: ['Cancelled'] } },
      order: [['travelDate', 'ASC']],
    });
    res.json({ activeBookings, totalBookings, upcomingTrips });
  } catch (err) {
    next(err);
  }
}

async function getDriverDashboard(req, res, next) {
  try {
    const driver = await Driver.findOne({ where: { userId: req.user.id } });
    if (!driver) {
      return res.json({
        pendingRequests: 0,
        pendingRequestsList: [],
        activeTrips: 0,
        activeTripsList: [],
        pastTripsList: [],
        todayTrips: [],
      });
    }

    const allBookings = await Booking.findAll({
      where: { driverId: driver.id },
      include: [
        { model: User, attributes: ['name'] },
        { model: Route, attributes: ['source', 'destination', 'departureTime', 'arrivalTime'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const formatBooking = b => ({
      id: b.id,
      travelerName: b.User ? b.User.name : null,
      route: b.Route ? `${b.Route.source} → ${b.Route.destination}` : null,
      travelDate: b.travelDate,
      status: b.status,
      departureTime: b.Route ? b.Route.departureTime : null,
      arrivalTime: b.Route ? b.Route.arrivalTime : null,
      seatCount: b.seatCount,
    });

    const pendingRequestsList = allBookings.filter(b => b.status === 'Pending').map(formatBooking);
    const activeTripsList = allBookings.filter(b => ['Confirmed', 'On Trip'].includes(b.status)).map(formatBooking);
    const pastTripsList = allBookings.filter(b => ['Completed', 'Cancelled'].includes(b.status)).map(formatBooking);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayTrips = allBookings.filter(b => b.travelDate === todayStr).map(formatBooking);

    res.json({
      pendingRequests: pendingRequestsList.length,
      pendingRequestsList,
      activeTrips: activeTripsList.length,
      activeTripsList,
      pastTripsList,
      todayTrips,
    });
  } catch (err) {
    next(err);
  }
}

async function getAdminDashboard(req, res, next) {
  try {
    const totalUsers = await User.count();
    const totalAgencies = await Agency.count();
    const totalActiveBookings = await Booking.count({
      where: { status: { [Op.notIn]: ['Cancelled', 'Completed'] } },
    });
    const statuses = ['Pending', 'Confirmed', 'On Trip', 'Completed', 'Cancelled'];
    const counts = await Promise.all(
      statuses.map(status => Booking.count({ where: { status } }))
    );
    const bookingsByStatus = {};
    statuses.forEach((s, i) => { bookingsByStatus[s] = counts[i]; });
    res.json({ totalUsers, totalAgencies, totalActiveBookings, bookingsByStatus });
  } catch (err) {
    next(err);
  }
}

module.exports = { getUserDashboard, getDriverDashboard, getAdminDashboard };
