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
      return res.status(404).json({ message: 'Driver profile not found' });
    }
    const pendingData = await Booking.findAll({
      where: { driverId: driver.id, status: 'Pending' },
      include: [
        { model: User, attributes: ['name'] },
        { model: Route, attributes: ['source', 'destination'] },
      ],
    });
    const activeTrips = await Booking.count({
      where: { driverId: driver.id, status: { [Op.in]: ['Confirmed', 'On Trip'] } },
    });
    const todayTrips = await Booking.findAll({
      where: { driverId: driver.id, travelDate: new Date().toISOString().split('T')[0] },
    });
    res.json({
      pendingRequests: pendingData.length,
      pendingRequestsList: pendingData.map(b => ({
        id: b.id,
        travelerName: b.User ? b.User.name : null,
        route: b.Route ? `${b.Route.source} → ${b.Route.destination}` : null,
      })),
      activeTrips,
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
