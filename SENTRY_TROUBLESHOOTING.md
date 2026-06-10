# Sentry Integration - Troubleshooting Guide

## Issue: No Events Appearing in Sentry Dashboard

### Step 1: Check Configuration ✅

```bash
# Frontend - Verify .env.local exists with DSN
cat frontend/.env.local
# Should show: REACT_APP_SENTRY_DSN=https://...

# Backend - Verify .env exists with DSN
cat backend/.env
# Should show: SENTRY_DSN=https://...
```

**Verify values**:
- Frontend: `https://b453ec066f30722aa6b653ee5ce9dfeb@o4511511040491520.ingest.de.sentry.io/4511540707590224`
- Backend: `https://f1da8622a266fe778420629fe4af1f0a@o4511511040491520.ingest.de.sentry.io/4511540714537040`

---

## Step 2: Test Sentry (Frontend)

### Method 1: Use Debug Page

1. **Start development server**:
   ```bash
   cd frontend
   npm start
   ```

2. **Open debug page**:
   ```
   http://localhost:3000/debug/sentry
   ```

3. **Test buttons** (in order):
   - Click "🔍 Check Status" → Should show DSN configured & initialized
   - Click "👤 Set User Context" → Adds user info
   - Click "🚨 Capture Exception" → Sends test error

4. **Check Sentry Dashboard**:
   - Go to: https://sentry.io
   - Select: **Travel Agency Frontend** project
   - Go to: **Issues** tab
   - Refresh (F5) to see new events
   - Should see new "Test error" issue

### Method 2: Browser DevTools Network Check

1. **Open DevTools** (F12 → Network tab)
2. Click "Capture Exception" button
3. **Look for requests to `sentry.io`**:
   - Should see POST request to `ingest.de.sentry.io/...`
   - Response should be `200 OK`
   - Response body should show `{"id":"...event-id..."}`

### Method 3: Console Debugging

Open Browser Console (F12) and paste:

```javascript
// Check if Sentry is initialized
console.log('Sentry Initialized:', Sentry.isInitialized());

// Check DSN
console.log('DSN:', process.env.REACT_APP_SENTRY_DSN);

// Send test message
Sentry.captureMessage('Console test message', 'info');
console.log('Message sent!');
```

---

## Step 3: Test Sentry (Backend)

### Method 1: Trigger Error Endpoint

1. **Start backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Curl test endpoint**:
   ```bash
   curl http://localhost:5000/sentry-test
   ```
   
   This will trigger a test error

3. **Check Sentry Dashboard**:
   - Select: **Travel Agency Backend** project
   - Go to: **Issues** tab
   - Refresh (F5)
   - Should see "Test error from backend"

### Method 2: Check Server Logs

In terminal where backend is running, look for:

```
[Sentry] 
Sentry event captured: {...}
```

---

## Common Issues & Solutions

### ❌ DSN not loading

**Problem**: `process.env.REACT_APP_SENTRY_DSN` is undefined

**Solutions**:
1. Stop dev server and restart: `npm start`
2. Check `.env.local` file exists in `frontend/` folder
3. Check file has correct content (no extra spaces/quotes)
4. Verify variable name is exactly `REACT_APP_SENTRY_DSN` (React env vars must start with `REACT_APP_`)

**Verify**:
```javascript
console.log(process.env.REACT_APP_SENTRY_DSN);
// Should print: https://key@domain.ingest.de.sentry.io/id
```

---

### ❌ Sentry is initialized but no events appear

**Problem**: Events not showing in dashboard

**Solutions**:

1. **Check if Sentry projects exist**:
   - Go to: https://sentry.io → Settings → Projects
   - Verify both projects exist: "Travel Agency Frontend" & "Travel Agency Backend"
   - Check they are **not archived** or **disabled**

2. **Verify sample rate**:
   ```javascript
   // In development, sample rate should be 1.0 (100%)
   // Development should send ALL events
   // Check src/utils/sentry.js
   ```

3. **Check DSN is correct**:
   - Copy exact DSN from Sentry project settings
   - Verify NO typos
   - Verify NO extra spaces at end

4. **Check Network Tab**:
   - F12 → Network tab
   - Trigger error
   - Look for requests to `ingest.de.sentry.io`
   - If no requests: Sentry not initialized
   - If requests but 4xx/5xx error: DSN incorrect

---

### ❌ Network error: CORS or 4xx/5xx

**Problem**: Error sending to Sentry server

**Solutions**:

1. **Check DSN format**:
   ```
   ✅ Correct: https://key@o123.ingest.de.sentry.io/projectid
   ❌ Wrong: https://key@domain.ingest.io/projectid
   ❌ Wrong: https://key@o123.de.sentry.io/projectid (wrong subdomain)
   ```

2. **Verify project still active**:
   - Go to https://sentry.io
   - Check project isn't archived
   - Check auth key hasn't been revoked

3. **Check browser console** for CORS errors:
   - If CORS error: Contact Sentry support or check allowed origins

---

### ❌ Events show "504" or "rejected"

**Problem**: Sentry server rejecting events

**Solutions**:

1. **Rate limit hit**: Too many events sent
   - In production, set lower sample rate (e.g., 0.1)
   - Check quota: Sentry Settings → Pricing

2. **Invalid event format**: Rarely happens with Sentry SDK
   - Try updating: `npm update @sentry/react @sentry/tracing`

3. **Check Sentry status**: https://status.sentry.io
   - If red, wait for service to recover

---

## Quick Verification Checklist

- [ ] `.env.local` exists in `frontend/` folder
- [ ] `.env` exists in `backend/` folder
- [ ] DSN values are correctly copied (no typos)
- [ ] Dev server restarted after adding `.env` files
- [ ] Sentry projects exist in dashboard
- [ ] `/debug/sentry` page shows "✅ Configured" & "✅ Initialized"
- [ ] "Capture Exception" button creates event
- [ ] Event appears in Sentry dashboard (refresh with F5)

---

## Testing Flow

```
npm start              → Start dev server
│
↓
http://localhost:3000/debug/sentry  → Open debug page
│
↓
Check Status button   → Verify DSN & init
│
↓
Capture Exception     → Send test error
│
↓
F12 Network tab       → Look for sentry.io request
│
↓
Sentry Dashboard      → Refresh Issues tab
│
↓
✅ Event appears!     → Integration working!
```

---

## Environment Variable Debug

**Frontend** - Check what's loaded:

```javascript
console.log({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  debug: process.env.REACT_APP_DEBUG,
});

// Check in browser console should show:
// {
//   dsn: "https://b453ec066f30722aa6b653ee5ce9dfeb@...",
//   environment: "development",
//   ...
// }
```

**Backend** - Check what's loaded:

```javascript
console.log({
  sentry_dsn: process.env.SENTRY_DSN,
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,
});

// Check in terminal should show:
// {
//   sentry_dsn: "https://f1da8622a266fe778420629fe4af1f0a@...",
//   node_env: "development",
//   port: "5000"
// }
```

---

## Still Not Working?

1. **Reset everything**:
   ```bash
   # Clear node_modules & reinstall
   cd frontend && rm -rf node_modules && npm install
   cd backend && rm -rf node_modules && npm install
   ```

2. **Verify file content**:
   ```bash
   # Check files exist
   ls -la frontend/.env.local
   ls -la backend/.env
   
   # Check content
   cat frontend/.env.local
   cat backend/.env
   ```

3. **Check Sentry projects**:
   - https://sentry.io → Settings → Projects
   - Verify both projects created
   - Check DSN in project settings

4. **Test with direct curl**:
   ```bash
   curl -X POST \
     "https://b453ec066f30722aa6b653ee5ce9dfeb@o4511511040491520.ingest.de.sentry.io/4511540707590224/envelope/" \
     -H "Content-Type: application/x-sentry-envelope" \
     -d 'eyJldmVudF9pZCI6IjEyMzQ1Njc4OTAiLCJjbGllbnQiOiJzZW50cnkvandlZXQifQ=='
   ```
   - If 200 OK: DSN works
   - If 4xx: DSN issue

---

**Status**: Created debug page at `/debug/sentry`  
**Next**: Go to http://localhost:3000/debug/sentry and test
