# Sentry Integration - Quick Reference

## ✅ What's Installed

### Frontend (`@sentry/react`)
- Error boundary & exception tracking
- Browser performance monitoring
- Automatic error capture with stack traces
- User context tracking

### Backend (`@sentry/node`)
- HTTP request tracking
- Express middleware integration
- Transaction monitoring
- Performance tracing

---

## 🚀 Getting Started

### 1. Get Sentry DSN
- Visit https://sentry.io
- Create account (free tier available)
- Create two projects: "Travel Agency Frontend" and "Travel Agency Backend"
- Copy the DSNs

### 2. Configure Environment Variables

**Frontend** - `.env.local`:
```bash
REACT_APP_SENTRY_DSN=https://key@domain.ingest.sentry.io/project-id
```

**Backend** - `.env`:
```bash
SENTRY_DSN=https://key@domain.ingest.sentry.io/project-id
```

### 3. Test Integration

**Frontend** - Open DevTools Console and run:
```javascript
throw new Error('Test Sentry');
```

**Backend** - Visit any endpoint to trigger request tracking

---

## 📝 Common Usage Patterns

### React Component Error Handling
```javascript
import { useErrorTracking } from '../hooks/useErrorTracking';

function MyComponent() {
  const { captureError, addBreadcrumb } = useErrorTracking();

  const handleAction = async () => {
    addBreadcrumb('User clicked action button');
    try {
      // do something
    } catch (error) {
      captureError(error, { action: 'handleAction' });
    }
  };

  return <button onClick={handleAction}>Click Me</button>;
}
```

### API Error Tracking
```javascript
import axios from 'axios';
import * as Sentry from '@sentry/react';

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });

api.interceptors.response.use(
  response => response,
  error => {
    Sentry.captureException(error);
    return Promise.reject(error);
  }
);
```

### Backend Error Handler
```javascript
import { captureException } from '../utils/sentry';

app.post('/api/bookings', async (req, res) => {
  try {
    const booking = await Booking.create(req.body);
    res.json(booking);
  } catch (error) {
    captureException(error, {
      endpoint: '/api/bookings',
      userId: req.user?.id,
    });
    res.status(500).json({ error: 'Failed to create booking' });
  }
});
```

---

## 📊 Monitoring Dashboard

After DSN is configured:
- **Issues**: View all errors with stack traces
- **Performance**: Monitor transaction duration & throughput
- **Releases**: Track errors per app version
- **Alerts**: Get notified of critical errors

---

## 🔒 Privacy & Security

✅ **Enabled**:
- User ID tracking
- Request URLs
- Stack traces
- System info

❌ **Disabled** (for privacy):
- Request body/params
- Cookies & auth tokens
- localStorage content
- User email

---

## 📈 Sample Rates

### Development
- **Traces**: 100% (all requests)
- **Replays**: 100% (all sessions)

### Production
- **Traces**: 10% (1 in 10 requests)
- **Replays**: 10% (1 in 10 sessions)

This reduces costs while maintaining visibility.

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| No events in Sentry | Check DSN is configured and correct format |
| Events not showing user | Make sure `Sentry.setUser()` is called |
| Performance data missing | Verify `tracesSampleRate > 0` |
| Too many events | Reduce sample rate in production |

---

## 📚 Additional Resources

- [Sentry React Docs](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Node Docs](https://docs.sentry.io/platforms/node/)
- [Sentry Best Practices](https://docs.sentry.io/product/best-practices/)

---

## Files Created/Modified

### New Files
- `/src/utils/sentry.js` (Frontend)
- `/src/utils/sentry.js` (Backend)
- `/src/hooks/useErrorTracking.js` (Frontend hook)
- `/SENTRY_SETUP.md` (Detailed guide)

### Modified Files
- `/src/index.js` - Initialize Sentry
- `/src/App.js` - Error boundary
- `/src/server.js` - Backend initialization
- `/.env.example` - Frontend DSN config
- `/.env` - Backend DSN config
