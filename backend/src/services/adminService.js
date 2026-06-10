const { User, Agency, Driver, Booking, Route, BookingStatusHistory, Sequelize } = require('../models');
const { Op } = Sequelize;

async function getUsers() {
  const users = await User.findAll({ attributes: { exclude: ['password'] } });
  return users;
}

async function toggleUserStatus(adminId, userId) {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  user.active = !user.active;
  await user.save();
  return user;
}

async function getAgencies() {
  const agencies = await Agency.findAll({ order: [['createdAt', 'DESC']] });
  return agencies;
}

async function createAgency(adminId, data) {
  const agency = await Agency.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    createdBy: adminId,
    adminId: data.adminId || null,
  });
  return agency;
}

async function updateAgency(adminId, agencyId, data) {
  const agency = await Agency.findByPk(agencyId);
  if (!agency) {
    const err = new Error('Agency not found');
    err.status = 404;
    throw err;
  }
  const allowedFields = ['name', 'email', 'phone'];
  const updates = {};
  allowedFields.forEach(f => {
    if (data[f] !== undefined) updates[f] = data[f];
  });
  await agency.update(updates);
  return agency;
}

async function deactivateAgency(adminId, agencyId) {
  const agency = await Agency.findByPk(agencyId);
  if (!agency) {
    const err = new Error('Agency not found');
    err.status = 404;
    throw err;
  }
  agency.active = !agency.active;
  await agency.save();

  if (!agency.active) {
    const driverIds = await Driver.findAll({ where: { agencyId }, attributes: ['id'] });
    const ids = driverIds.map(d => d.id);

    const pendingBookings = await Booking.findAll({
      where: { driverId: { [Op.in]: ids }, status: 'Pending' },
    });
    for (const booking of pendingBookings) {
      const prevStatus = booking.status;
      booking.status = 'Cancelled';
      booking.cancelReason = 'Agency deactivated';
      await booking.save();
      await BookingStatusHistory.create({
        bookingId: booking.id,
        fromStatus: prevStatus,
        toStatus: 'Cancelled',
        changedBy: adminId,
      });
    }
  }

  return agency;
}

async function getAllBookings() {
  const bookings = await Booking.findAll({
    include: [
      { model: Driver, attributes: ['name'], include: [{ model: Agency, attributes: ['name'] }] },
      { model: User, attributes: ['name'] },
    ],
    order: [['createdAt', 'DESC']],
  });
  return bookings;
}

async function adminCancelBooking(adminId, bookingId, reason) {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }
  const prevStatus = booking.status;
  booking.status = 'Cancelled';
  booking.cancelReason = reason || 'Cancelled by admin';
  booking.cancelledBy = adminId;
  await booking.save();
  await BookingStatusHistory.create({
    bookingId: booking.id,
    fromStatus: prevStatus,
    toStatus: 'Cancelled',
    changedBy: adminId,
  });
  return booking;
}

async function getDashboardData() {
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
  return { totalUsers, totalAgencies, totalActiveBookings, bookingsByStatus };
}

module.exports = {
  getUsers,
  toggleUserStatus,
  getAgencies,
  createAgency,
  updateAgency,
  deactivateAgency,
  getAllBookings,
  adminCancelBooking,
  getDashboardData,
};
