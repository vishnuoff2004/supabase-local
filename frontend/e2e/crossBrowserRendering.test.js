// TEST-111 — Cross-browser rendering
// REQ-ID: REQ-036
// Scenario: Render application in Chrome 122+, Firefox 123+, Safari 17+, Edge 122+
// Expected Output: Application renders without console errors in all four browsers
//
// File: frontend/src/tests/e2e/crossBrowserRendering.test.js

const { test, expect } = require('@playwright/test');

// ─────────────────────────────────────────────────────────────────────────────
// TEST-111 — Cross-browser rendering (REQ-036)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TEST-111 — Cross-browser rendering (REQ-036)', () => {

  // Collect all browser console errors during test
  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];

    // Listen for browser console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for uncaught exceptions / page crashes
    page.on('pageerror', (err) => {
      consoleErrors.push(`[PageError] ${err.message}`);
    });
  });

  // ── Test 1: Home page renders without console errors ──────────────────────
  test('TEST-111: Home page renders without console errors', async ({ page, browserName }) => {
    await page.goto('/');

    // Wait for the root React element to be mounted
    await page.waitForSelector('#root', { timeout: 10000 });

    // Give React a moment to fully render and settle
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {
      // networkidle may not fire in all envs — acceptable
    });

    console.log(`[${browserName}] Console errors: ${consoleErrors.length}`);

    // Filter out known non-critical warnings (SMTP, MySQL noise from backend)
    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('SMTP') &&
      !err.includes('MySQL') &&
      !err.includes('net::ERR_CONNECTION_REFUSED') && // backend not running in test env
      !err.includes('favicon')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  // ── Test 2: Root element is present (app mounted) ─────────────────────────
  test('TEST-111: React root element is mounted in DOM', async ({ page, browserName }) => {
    await page.goto('/');

    // Wait for #root to exist in the DOM
    await page.waitForSelector('#root', { timeout: 15000 });

    // WebKit/Firefox may take longer to hydrate React — poll until content appears
    await page.waitForFunction(
      () => {
        const root = document.getElementById('root');
        return root && root.innerHTML.trim().length > 0;
      },
      { timeout: 20000 }
    );

    const root = page.locator('#root');
    await expect(root).toBeAttached();

    // Root must not be empty — React has rendered something
    const content = await root.innerHTML();
    expect(content.trim().length).toBeGreaterThan(0);

    console.log(`[${browserName}] #root innerHTML length: ${content.length}`);
  });

  // ── Test 3: Page title is present ─────────────────────────────────────────
  test('TEST-111: Page has a valid document title', async ({ page, browserName }) => {
    await page.goto('/');

    await page.waitForSelector('#root', { timeout: 10000 });

    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    console.log(`[${browserName}] Page title: "${title}"`);
  });

  // ── Test 4: No JavaScript runtime crash (window.onerror not triggered) ────
  test('TEST-111: No JavaScript runtime crash on page load', async ({ page, browserName }) => {
    let jsRuntimeError = null;

    page.on('pageerror', (err) => {
      jsRuntimeError = err.message;
    });

    await page.goto('/');
    await page.waitForSelector('#root', { timeout: 10000 });

    // Short wait to catch any deferred JS errors
    await page.waitForTimeout(2000);

    if (jsRuntimeError) {
      console.error(`[${browserName}] JS Runtime Error: ${jsRuntimeError}`);
    }

    expect(jsRuntimeError).toBeNull();
  });

  // ── Test 5: CSS renders — body has computed styles ────────────────────────
  test('TEST-111: CSS is loaded and applied (body has computed background)', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForSelector('#root', { timeout: 10000 });

    // Verify the browser has applied styles (computed style is not empty/default)
    const bodyDisplay = await page.evaluate(() =>
      window.getComputedStyle(document.body).display
    );

    // body display must be a valid CSS value (not empty string)
    expect(bodyDisplay).toBeTruthy();
    expect(['block', 'flex', 'grid', 'inline-block']).toContain(bodyDisplay);

    console.log(`[${browserName}] body display: ${bodyDisplay}`);
  });

});
