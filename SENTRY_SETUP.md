# Sentry Error Tracking Setup Guide

## Overview
Sentry is a real-time error tracking and monitoring platform integrated into the Travel Agency application for both frontend and backend.

## Installation Status
✅ Frontend: `@sentry/react` and `@sentry/tracing` installed  
✅ Backend: `@sentry/node` and `@sentry/tracing` installed

---

## Frontend Setup (React)

### Configuration
**File**: `/src/utils/sentry.js`
**Initialization**: `/src/index.js`

### Environment Variables
Add to `.env` (or `.env.local`):
```
REACT_APP_SENTRY_DSN=https://your-key@your-domain.ingest.sentry.io/your-project-id
```

### Features
- ✅ **Error Tracking**: Automatic error boundary and exception capture
- ✅ **Performance Monitoring**: BrowserTracing integration
- ✅ **User Context**: Automatic user identification from AuthContext
- ✅ **Development Mode**: Console logging of Sentry events
- ✅ **Production Mode**: Reduced sample rate (10%) to minimize costs

### How It Works
1. **Error Boundary**: Wraps the entire app in `<Sentry.ErrorBoundary>`
2. **Automatic Capture**: Unhandled errors automatically sent to Sentry
3. **Manual Capture**: Use `Sentry.captureException()` or `Sentry.captureMessage()`
4. **User Tracking**: Errors include user info from auth context

### Usage Examples

#### Capture Exception
```javascript
import * as Sentry from '@sentry/react';

try {
  // some code
} catch (error) {
  Sentry.captureException(error);
}
```

#### Capture Message
```javascript
Sentry.captureMessage('User completed booking', 'info');
```

#### Set User Context
```javascript
Sentry.setUser({
  id: user.id,
  email: user.email,
  role: user.role,
});
```

#### Add Custom Breadcrumb
```javascript
Sentry.addBreadcrumb({
  category: 'booking',
  message: 'User initiated booking',
  level: 'info',
});
```

---

## Backend Setup (Node.js)

### Configuration
**File**: `/src/utils/sentry.js`
**Initialization**: `/src/server.js`

### Environment Variables
Add to `.env`:
```
SENTRY_DSN=https://your-key@your-domain.ingest.sentry.io/your-project-id
```

### Features
- ✅ **Request Tracing**: All HTTP requests tracked
- ✅ **Error Handler**: Express error handler middleware
- ✅ **Performance Monitoring**: Transaction tracking
- ✅ **Context Capture**: Custom error context
- ✅ **Development Mode**: Console logging of events

### Middleware Integration
Sentry is automatically integrated into Express:
1. `Sentry.Handlers.requestHandler()` - Captures request data
2. `Sentry.Handlers.tracingHandler()` - Tracks performance
3. `Sentry.Handlers.errorHandler()` - Handles errors

### Usage Examples

#### Capture Exception
```javascript
import { captureException } from './utils/sentry';

try {
  // some code
} catch (error) {
  captureException(error, { endpoint: '/api/bookings' });
}
```

#### Capture Message
```javascript
import { captureMessage } from './utils/sentry';

captureMessage('Payment processed successfully', 'info', {
  bookingId: '123',
  amount: 5000,
});
```

#### In Express Routes
```javascript
const router = require('express').Router();
import { captureException } from '../utils/sentry';

router.post('/bookings', async (req, res) => {
  try {
    // handle booking
  } catch (error) {
    captureException(error, {
      endpoint: '/bookings',
      userId: req.user.id,
    });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
```

---

## Getting a Sentry DSN

### Steps to Create a Sentry Project

1. **Sign up / Log in** at https://sentry.io
2. **Create Organization** (if new account)
3. **Create Project**:
   - Select **React** for frontend
   - Select **Node.js** for backend
   - Get the DSN from project settings
4. **Copy DSN** and add to `.env` files

### DSN Format
```
https://public-key@sentry-domain.ingest.sentry.io/project-id
```

---

## Monitoring & Alerts

### Frontend Dashboard
- Navigate to **Issues** to see errors
- Filter by release, environment, user
- View stack traces and breadcrumbs
- Access source maps for debugging

### Backend Dashboard
- Monitor **Performance** metrics
- Track transaction duration
- View error rates per endpoint
- Check distributed traces

### Alerts
Configure alerts in Sentry settings:
- Alert when error rate exceeds threshold
- Slack/Email notifications
- Custom alert rules per project

---

## Best Practices

### ✅ DO:
- Add user context in AuthContext
- Use breadcrumbs for user actions
- Set environment (development/production)
- Add custom tags for filtering
- Capture meaningful error messages

### ❌ DON'T:
- Send sensitive data (passwords, tokens)
- Overuse `captureMessage()`
- Set high sample rates in production
- Include PII in error messages
- Forget to configure DSN in production

---

## Environment Configuration

### Development
- Sample rate: 100% (all errors captured)
- Console logging: Enabled
- Source maps: Included
- Performance monitoring: Enabled

### Production
- Sample rate: 10% (reduced to minimize costs)
- Console logging: Disabled
- Source maps: Uploaded to Sentry
- Performance monitoring: Sampled

---

## Troubleshooting

### DSN Not Working
- Verify `REACT_APP_SENTRY_DSN` (frontend) or `SENTRY_DSN` (backend)
- Check DSN format: `https://key@domain.ingest.sentry.io/id`
- Ensure environment variables are loaded

### No Events Appearing
- Check if DSN is configured
- Verify environment name matches Sentry project
- Check Sentry project settings → Allowed domains

### Performance Issues
- Reduce `tracesSampleRate` in production
- Disable unwanted integrations
- Check network tab for Sentry requests

---

## Files Modified

### Frontend
- `/src/utils/sentry.js` - Sentry initialization
- `/src/index.js` - Initialize Sentry on app startup
- `/src/App.js` - Error boundary and Sentry wrapper
- `/.env.example` - Added REACT_APP_SENTRY_DSN

### Backend
- `/src/utils/sentry.js` - Sentry initialization & helpers
- `/src/server.js` - Initialize Sentry middleware
- `/.env` - Added SENTRY_DSN

---

## Next Steps

1. **Create Sentry Account**: Sign up at https://sentry.io
2. **Create Projects**: One for frontend, one for backend
3. **Copy DSNs**: Add to `.env` files
4. **Test Integration**: Trigger test error
5. **Configure Alerts**: Set up notifications
6. **Upload Source Maps** (production): Enable in CI/CD

---

## Support
For more info: https://docs.sentry.io/
