require('dotenv').config();

const { createServer } = require('http');
const { initSentry, attachSentryErrorHandler } = require('./utils/sentry');
const app = require('./app');
const { createSocketServer } = require('./socket');

const PORT = process.env.PORT || 5000;

initSentry(app);

const httpServer = createServer(app);

const io = createSocketServer(httpServer);
app.set('io', io);

app.set('io', io);

attachSentryErrorHandler(app);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, httpServer, io };
