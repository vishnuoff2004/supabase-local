const path = require('path');
const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');
const { authorize } = require('./middleware/rbac');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const bookingRoutes = require('./routes/bookings');
const driverRoutes = require('./routes/drivers');
const agencyRoutes = require('./routes/agency');
const adminRoutes = require('./routes/admin');
const searchRoutes = require('./routes/search');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const reportsRoutes = require('./routes/reports');
const { rateLimiter } = require('./middleware/rateLimiter');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(require('./monitoring/metrics').metricsMiddleware);
app.use(rateLimiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/routes', searchRoutes);
app.use('/api/bookings', authenticate, bookingRoutes);
app.use('/api/drivers', authenticate, driverRoutes);
app.use('/api/agency', authenticate, authorize('agency_admin', 'admin'), agencyRoutes);
app.use('/api/admin', authenticate, authorize('admin'), adminRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/metrics', require('./routes/metrics'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/events', require('./routes/events'));

const frontendBuild = path.join(__dirname, '../../frontend/build');
app.use(express.static(frontendBuild));

app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(frontendBuild, 'index.html'));
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
