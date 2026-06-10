# Sentry Integration - Verification & Testing

## ✅ Configuration Status

### Frontend
- **DSN**: `https://b453ec066f30722aa6b653ee5ce9dfeb@o4511511040491520.ingest.de.sentry.io/4511540707590224`
- **Configured**: ✅ Yes
- **File**: `.env.local` & `.env.example`
- **Environment Variable**: `REACT_APP_SENTRY_DSN`

### Backend
- **DSN**: `https://f1da8622a266fe778420629fe4af1f0a@o4511511040491520.ingest.de.sentry.io/4511540714537040`
- **Configured**: ✅ Yes
- **File**: `.env`
- **Environment Variable**: `SENTRY_DSN`

---

## 🧪 Testing Sentry Integration

### Frontend Testing

#### Option 1: Use Browser Console
1. Start your development server: `npm start`
2. Open Developer Tools (F12)
3. Go to **Console** tab
4. Import and run test functions:

```javascript
// Test 1: Check Sentry initialization
import { testSentryIntegration } from './src/utils/sentryTest.js';
testSentryIntegration();

// Test 2: Trigger test error
import { triggerTestError } from './src/utils/sentryTest.js';
triggerTestError();

// Test 3: Send test message
import { triggerTestMessage } from './src/utils/sentryTest.js';
triggerTestMessage();
```

#### Option 2: Trigger Real Error
In any component, add this temporarily:
```javascript
useEffect(() => {
  throw new Error('Testing Sentry integration');
}, []);
```

#### Option 3: Use Test Component
Create a temporary component:
```javascript
import { triggerTestError, triggerTestMessage } from '../utils/sentryTest';

export function SentryTestComponent() {
  return (
    <div style={{ padding: '20px', margin: '20px', border: '2px solid red' }}>
      <h2>Sentry Testing</h2>
      <button onClick={triggerTestError}>Trigger Test Error</button>
      <button onClick={triggerTestMessage}>Send Test Message</button>
    </div>
  );
}
```

### Backend Testing

#### Option 1: Test Endpoint
Add to `src/routes/health.js` or similar:
```javascript
router.get('/sentry-test', (req, res) => {
  // This will trigger Sentry error handler
  throw new Error('This is a test error from backend');
});
```

Then visit: `http://localhost:5000/api/health/sentry-test`

#### Option 2: Manual Capture
In any route:
```javascript
import { captureMessage, captureException } from '../utils/sentry';

// Test message
captureMessage('Backend is working', 'info', { test: true });

// Test error
try {
  throw new Error('Test backend error');
} catch (error) {
  captureException(error, { endpoint: '/test' });
}
```

---

## 📊 Verifying in Sentry Dashboard

### Frontend Project
1. Go to: https://sentry.io
2. Select: **Travel Agency Frontend**
3. Look for:
   - **Issues** tab → New errors appearing
   - **Performance** tab → Transaction data
   - **Releases** tab → App version info

### Backend Project
1. Go to: https://sentry.io
2. Select: **Travel Agency Backend**
3. Look for:
   - **Issues** tab → New errors appearing
   - **Performance** tab → API response times
   - **Transactions** tab → Request tracking

---

## 🔍 What to Expect

### After Triggering Test Error

**In Sentry Dashboard**:
- New issue appears in Issues list
- Stack trace shows the error
- Breadcrumbs show action history
- User context shows current user
- Environment shows "development" or "production"

**Console Output** (in development):
```
Sentry Event: {
  event_id: "...",
  message: "Error: This is a test error",
  level: "error",
  environment: "development",
  ...
}
```

---

## ✅ Checklist

- [ ] Frontend DSN configured in `.env.local`
- [ ] Backend DSN configured in `.env`
- [ ] Frontend builds successfully
- [ ] Backend starts without errors
- [ ] Test error appears in Sentry dashboard
- [ ] User context is captured
- [ ] Environment is set correctly
- [ ] Performance data is being tracked

---

## 🛠️ Troubleshooting

### "Sentry is not initialized"
- Check `.env` file exists and has correct DSN
- Make sure `initSentry()` is called in `index.js`
- Restart development server

### "No events in Sentry"
- Verify DSN is correct (check for typos)
- Check Sentry project still exists
- Ensure environment variable is loaded
- Try refreshing Sentry dashboard (F5)

### "Events appear but no user context"
- Verify `Sentry.setUser()` is being called
- Check user data is being retrieved from AuthContext
- Confirm user object has `id` and `role` properties

### "Performance data missing"
- Check `tracesSampleRate > 0` in config
- Ensure BrowserTracing integration is enabled
- Check network tab for Sentry requests

---

## 📝 Next Steps

1. **Run tests** using methods above
2. **Monitor dashboard** for incoming events
3. **Configure alerts** in Sentry settings
4. **Set up team notifications** (Slack, Email, etc.)
5. **Review error patterns** weekly

---

## 💡 Pro Tips

### Enable Sentry in Development
Add this to your React component to debug:
```javascript
import { testSentryIntegration } from './utils/sentryTest';

useEffect(() => {
  console.log(testSentryIntegration());
}, []);
```

### Track User Actions
```javascript
import * as Sentry from '@sentry/react';

Sentry.addBreadcrumb({
  category: 'user-action',
  message: 'User booked a trip',
  level: 'info',
});
```

### Custom Error Context
```javascript
import { captureException } from './utils/sentry';

captureException(error, {
  userId: user.id,
  bookingId: booking.id,
  amount: totalFare,
});
```

---

## 📞 Support

- Sentry React Docs: https://docs.sentry.io/platforms/javascript/guides/react/
- Sentry Node Docs: https://docs.sentry.io/platforms/node/
- Community Forum: https://forum.sentry.io/

---

**Last Updated**: 2026-06-10
**Status**: ✅ Ready for Testing
