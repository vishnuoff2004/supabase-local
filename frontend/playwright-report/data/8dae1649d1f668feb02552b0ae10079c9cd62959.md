# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: crossBrowserRendering.test.js >> TEST-111 — Cross-browser rendering (REQ-036) >> TEST-111: React root element is mounted in DOM
- Location: src\tests\e2e\crossBrowserRendering.test.js:61:3

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - alert [ref=e4]:
      - generic [ref=e5]:
        - strong [ref=e6]: Welcome to Travel Agency Platform
        - text: We are excited to launch our new booking platform. Enjoy seamless travel booking!
      - button "Dismiss" [ref=e7] [cursor=pointer]
    - alert [ref=e8]:
      - generic [ref=e9]:
        - strong [ref=e10]: Holiday Schedule
        - text: Services will be limited during the upcoming holiday weekend. Please plan accordingly.
      - button "Dismiss" [ref=e11] [cursor=pointer]
  - generic [ref=e12]:
    - button "🌐 ▼" [ref=e15] [cursor=pointer]:
      - generic [ref=e16]: 🌐
      - generic [ref=e17]: ▼
    - generic [ref=e19]:
      - generic [ref=e21]: TP
      - heading "Welcome Back" [level=1] [ref=e22]
      - paragraph [ref=e23]: Sign in to your TravelPro account
      - generic [ref=e24]:
        - generic [ref=e25]:
          - generic [ref=e26]: Email
          - textbox "Email" [active] [ref=e27]:
            - /placeholder: you@example.com
        - generic [ref=e28]:
          - generic [ref=e29]: Password
          - textbox "Password" [ref=e30]:
            - /placeholder: Enter your password
        - button "Sign In" [ref=e31] [cursor=pointer]
      - generic [ref=e32]:
        - text: Don't have an account?
        - link "Create one" [ref=e33]:
          - /url: /register
      - group [ref=e34]:
        - generic "Demo Accounts" [ref=e35] [cursor=pointer]
```

# Test source

```ts
  1   | // TEST-111 — Cross-browser rendering
  2   | // REQ-ID: REQ-036
  3   | // Scenario: Render application in Chrome 122+, Firefox 123+, Safari 17+, Edge 122+
  4   | // Expected Output: Application renders without console errors in all four browsers
  5   | //
  6   | // File: frontend/src/tests/e2e/crossBrowserRendering.test.js
  7   | 
  8   | const { test, expect } = require('@playwright/test');
  9   | 
  10  | // ─────────────────────────────────────────────────────────────────────────────
  11  | // TEST-111 — Cross-browser rendering (REQ-036)
  12  | // ─────────────────────────────────────────────────────────────────────────────
  13  | 
  14  | test.describe('TEST-111 — Cross-browser rendering (REQ-036)', () => {
  15  | 
  16  |   // Collect all browser console errors during test
  17  |   let consoleErrors = [];
  18  | 
  19  |   test.beforeEach(async ({ page }) => {
  20  |     consoleErrors = [];
  21  | 
  22  |     // Listen for browser console errors
  23  |     page.on('console', (msg) => {
  24  |       if (msg.type() === 'error') {
  25  |         consoleErrors.push(msg.text());
  26  |       }
  27  |     });
  28  | 
  29  |     // Listen for uncaught exceptions / page crashes
  30  |     page.on('pageerror', (err) => {
  31  |       consoleErrors.push(`[PageError] ${err.message}`);
  32  |     });
  33  |   });
  34  | 
  35  |   // ── Test 1: Home page renders without console errors ──────────────────────
  36  |   test('TEST-111: Home page renders without console errors', async ({ page, browserName }) => {
  37  |     await page.goto('/');
  38  | 
  39  |     // Wait for the root React element to be mounted
  40  |     await page.waitForSelector('#root', { timeout: 10000 });
  41  | 
  42  |     // Give React a moment to fully render and settle
  43  |     await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {
  44  |       // networkidle may not fire in all envs — acceptable
  45  |     });
  46  | 
  47  |     console.log(`[${browserName}] Console errors: ${consoleErrors.length}`);
  48  | 
  49  |     // Filter out known non-critical warnings (SMTP, MySQL noise from backend)
  50  |     const criticalErrors = consoleErrors.filter(err =>
  51  |       !err.includes('SMTP') &&
  52  |       !err.includes('MySQL') &&
  53  |       !err.includes('net::ERR_CONNECTION_REFUSED') && // backend not running in test env
  54  |       !err.includes('favicon')
  55  |     );
  56  | 
  57  |     expect(criticalErrors).toHaveLength(0);
  58  |   });
  59  | 
  60  |   // ── Test 2: Root element is present (app mounted) ─────────────────────────
  61  |   test('TEST-111: React root element is mounted in DOM', async ({ page, browserName }) => {
  62  |     await page.goto('/');
  63  | 
  64  |     const root = page.locator('#root');
  65  |     await expect(root).toBeAttached();
  66  | 
  67  |     // Root must not be empty — React has rendered something
  68  |     const content = await root.innerHTML();
> 69  |     expect(content.trim().length).toBeGreaterThan(0);
      |                                   ^ Error: expect(received).toBeGreaterThan(expected)
  70  | 
  71  |     console.log(`[${browserName}] #root innerHTML length: ${content.length}`);
  72  |   });
  73  | 
  74  |   // ── Test 3: Page title is present ─────────────────────────────────────────
  75  |   test('TEST-111: Page has a valid document title', async ({ page, browserName }) => {
  76  |     await page.goto('/');
  77  | 
  78  |     await page.waitForSelector('#root', { timeout: 10000 });
  79  | 
  80  |     const title = await page.title();
  81  |     expect(title.length).toBeGreaterThan(0);
  82  | 
  83  |     console.log(`[${browserName}] Page title: "${title}"`);
  84  |   });
  85  | 
  86  |   // ── Test 4: No JavaScript runtime crash (window.onerror not triggered) ────
  87  |   test('TEST-111: No JavaScript runtime crash on page load', async ({ page, browserName }) => {
  88  |     let jsRuntimeError = null;
  89  | 
  90  |     page.on('pageerror', (err) => {
  91  |       jsRuntimeError = err.message;
  92  |     });
  93  | 
  94  |     await page.goto('/');
  95  |     await page.waitForSelector('#root', { timeout: 10000 });
  96  | 
  97  |     // Short wait to catch any deferred JS errors
  98  |     await page.waitForTimeout(2000);
  99  | 
  100 |     if (jsRuntimeError) {
  101 |       console.error(`[${browserName}] JS Runtime Error: ${jsRuntimeError}`);
  102 |     }
  103 | 
  104 |     expect(jsRuntimeError).toBeNull();
  105 |   });
  106 | 
  107 |   // ── Test 5: CSS renders — body has computed styles ────────────────────────
  108 |   test('TEST-111: CSS is loaded and applied (body has computed background)', async ({ page, browserName }) => {
  109 |     await page.goto('/');
  110 |     await page.waitForSelector('#root', { timeout: 10000 });
  111 | 
  112 |     // Verify the browser has applied styles (computed style is not empty/default)
  113 |     const bodyDisplay = await page.evaluate(() =>
  114 |       window.getComputedStyle(document.body).display
  115 |     );
  116 | 
  117 |     // body display must be a valid CSS value (not empty string)
  118 |     expect(bodyDisplay).toBeTruthy();
  119 |     expect(['block', 'flex', 'grid', 'inline-block']).toContain(bodyDisplay);
  120 | 
  121 |     console.log(`[${browserName}] body display: ${bodyDisplay}`);
  122 |   });
  123 | 
  124 | });
  125 | 
```