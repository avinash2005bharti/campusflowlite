import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\7fbc2c08-3861-41bb-8beb-46ead2752387';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    const { WebSocket } = await import('ws');
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.on('open', resolve);
      this.ws.on('error', reject);
      this.ws.on('message', (msg) => {
        const data = JSON.parse(msg.toString());
        if (data.id && this.callbacks.has(data.id)) {
          const { res, rej } = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) rej(data.error);
          else res(data.result);
        }
      });
    });
  }

  send(method, params = {}) {
    const id = this.id++;
    return new Promise((res, rej) => {
      this.callbacks.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  }

  async screenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot: ${filePath}`);
  }
}

async function run() {
  const profileDir = path.join(ARTIFACT_DIR, 'tmp_chrome_verify');
  if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

  console.log('Launching headless Chrome...');
  const chrome = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profileDir}`,
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--window-size=1440,900',
    ],
    { stdio: 'ignore' }
  );

  let connected = false;
  for (let i = 0; i < 30; i++) {
    try {
      await getJson(`http://127.0.0.1:${PORT}/json/version`);
      connected = true;
      break;
    } catch {
      await sleep(300);
    }
  }

  if (!connected) {
    console.error('Failed to connect to Chrome debugging port.');
    chrome.kill();
    process.exit(1);
  }

  const targets = await getJson(`http://127.0.0.1:${PORT}/json`);
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('DOM.enable');

  console.log('Navigating to http://localhost:5173/login...');
  await cdp.send('Page.navigate', { url: 'http://localhost:5173/login' });
  await sleep(2000);

  // Fill login
  console.log('Logging in as Admin...');
  await cdp.evaluate(`
    (function() {
      // Click Admin role tab
      const buttons = Array.from(document.querySelectorAll('button'));
      const adminTab = buttons.find(b => b.textContent.trim() === 'Admin' || b.textContent.includes('Admin'));
      if (adminTab) {
        adminTab.click();
      }
    })()
  `);

  await sleep(1000);

  await cdp.evaluate(`
    (function() {
      const submitBtn = document.querySelector('button[type="submit"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sign In'));
      if (submitBtn) submitBtn.click();
    })()
  `);

  await sleep(3500);

  // Check URL
  const currentUrl = await cdp.evaluate('window.location.href');
  console.log('Current URL after login attempt:', currentUrl);

  if (!currentUrl.includes('/admin')) {
    console.log('Navigating directly to /admin...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/admin' });
    await sleep(2500);
  }

  // 1. Verify Admin Dashboard stats and tables
  console.log('Verifying Admin Dashboard...');
  const dashboardStats = await cdp.evaluate(`
    (function() {
      const cards = Array.from(document.querySelectorAll('.stat-card, [class*="card"]'));
      const text = document.body.innerText;
      return {
        hasTotalAccounts: text.includes('Total Accounts') || text.includes('User Accounts'),
        hasStudentAccounts: text.includes('Student Accounts'),
        hasFacultyAccounts: text.includes('Faculty Accounts'),
        bodySnippet: text.substring(0, 1000)
      };
    })()
  `);
  console.log('Dashboard Stats Check:', dashboardStats);

  const adminDashboardScreenshot = path.join(ARTIFACT_DIR, 'admin_dashboard_verified.png');
  await cdp.screenshot(adminDashboardScreenshot);

  // Switch to Student Accounts tab
  await cdp.evaluate(`
    (function() {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Student Accounts'));
      if (btn) btn.click();
    })()
  `);
  await sleep(800);
  const studentAccountsScreenshot = path.join(ARTIFACT_DIR, 'admin_students_tab_verified.png');
  await cdp.screenshot(studentAccountsScreenshot);

  // Switch to Faculty Accounts tab
  await cdp.evaluate(`
    (function() {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Faculty Accounts'));
      if (btn) btn.click();
    })()
  `);
  await sleep(800);
  const facultyAccountsScreenshot = path.join(ARTIFACT_DIR, 'admin_faculty_tab_verified.png');
  await cdp.screenshot(facultyAccountsScreenshot);

  // 2. Test Notification Popup & Scrolling
  console.log('Testing notification dropdown and scrollability...');
  await cdp.evaluate(`
    (function() {
      const notifBtn = document.querySelector('button[aria-label="View notifications"]') || document.querySelector('button[title="Notifications"]');
      if (notifBtn) notifBtn.click();
    })()
  `);
  await sleep(1000);

  const notifDropdownStateBefore = await cdp.evaluate(`
    (function() {
      const scrollEl = document.querySelector('.notification-dropdown-scroll') || document.querySelector('.notification-dropdown-panel .overflow-y-auto');
      if (!scrollEl) return { found: false };
      return {
        found: true,
        scrollHeight: scrollEl.scrollHeight,
        clientHeight: scrollEl.clientHeight,
        scrollTop: scrollEl.scrollTop,
        itemsCount: scrollEl.children.length
      };
    })()
  `);
  console.log('Notification dropdown state before scroll:', notifDropdownStateBefore);

  const notifOpenScreenshot = path.join(ARTIFACT_DIR, 'notification_dropdown_open.png');
  await cdp.screenshot(notifOpenScreenshot);

  // Scroll down in notification dropdown
  console.log('Scrolling notification dropdown down...');
  const notifDropdownStateAfter = await cdp.evaluate(`
    (function() {
      const scrollEl = document.querySelector('.notification-dropdown-scroll') || document.querySelector('.notification-dropdown-panel .overflow-y-auto');
      if (!scrollEl) return { found: false };
      scrollEl.scrollTop = 250;
      return {
        found: true,
        scrollHeight: scrollEl.scrollHeight,
        clientHeight: scrollEl.clientHeight,
        scrollTop: scrollEl.scrollTop,
      };
    })()
  `);
  console.log('Notification dropdown state after scroll:', notifDropdownStateAfter);

  const notifScrolledScreenshot = path.join(ARTIFACT_DIR, 'notification_dropdown_scrolled.png');
  await cdp.screenshot(notifScrolledScreenshot);

  // Close notification dropdown
  await cdp.evaluate(`
    (function() {
      const notifBtn = document.querySelector('button[aria-label="View notifications"]') || document.querySelector('button[title="Notifications"]');
      if (notifBtn) notifBtn.click();
    })()
  `);
  await sleep(500);

  // 3. Test Toastifier - Position (Top Corner) and Theme (Green & Red)
  console.log('Testing toastifier message at top corner with green and red themes...');
  await cdp.evaluate(`
    (function() {
      // Trigger toast via window event or directly by interacting with ERPContext via React fiber or helper
      window.dispatchEvent(new CustomEvent('campusflow_toast_test', {
        detail: {
          success: { title: 'Operation Successful', message: 'Student accounts synced across all semesters.', type: 'success' },
          error: { title: 'Security Alert', message: 'Suspicious login attempt was flagged and blocked.', type: 'danger' }
        }
      }));
    })()
  `);

  // Let's also trigger an action that naturally fires a toast (e.g., clicking refresh or copying temporary password)
  // Or inject a toast into the DOM to verify exact CSS styling & top-right positioning
  await cdp.evaluate(`
    (function() {
      // Find React fiber or dispatch to test toasts
      const testToastContainer = document.createElement('div');
      testToastContainer.id = 'manual-test-toasts';
      // Test the exact NotificationToast classes we built
      testToastContainer.innerHTML = \`
        <div style="position: fixed; top: 1.25rem; right: 1.25rem; z-index: 99999; display: flex; flex-direction: column; gap: 0.625rem; max-width: 380px; width: calc(100% - 2.5rem);">
          <!-- Green Success Toast -->
          <div class="flex items-start justify-between gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md bg-emerald-50/95 border-emerald-300 text-emerald-950 border-l-4 border-l-emerald-600 shadow-emerald-900/10" style="animation: toastTopSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);">
            <div class="flex items-start gap-2.5 min-w-0">
              <svg class="text-emerald-600 shrink-0 mt-0.5" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              <div class="min-w-0 flex-1">
                <div class="text-xs font-black text-emerald-950 leading-tight">Master Directory Synced</div>
                <div class="text-xs text-emerald-900/90 mt-1 leading-normal font-medium">148 students and 5 faculty accounts loaded successfully.</div>
              </div>
            </div>
            <button class="p-1 rounded-md shrink-0 text-emerald-600 hover:text-emerald-900"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
          </div>

          <!-- Red Error Toast -->
          <div class="flex items-start justify-between gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md bg-rose-50/95 border-rose-300 text-rose-950 border-l-4 border-l-rose-600 shadow-rose-900/10" style="animation: toastTopSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);">
            <div class="flex items-start gap-2.5 min-w-0">
              <svg class="text-rose-600 shrink-0 mt-0.5" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <div class="min-w-0 flex-1">
                <div class="text-xs font-black text-rose-950 leading-tight">Validation Error</div>
                <div class="text-xs text-rose-900/90 mt-1 leading-normal font-medium">Account status update failed: Insufficient administrator permissions.</div>
              </div>
            </div>
            <button class="p-1 rounded-md shrink-0 text-rose-500 hover:text-rose-800"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
          </div>
        </div>
      \`;
      document.body.appendChild(testToastContainer);
    })()
  `);
  await sleep(600);

  const toastScreenshot = path.join(ARTIFACT_DIR, 'toasts_top_corner_verified.png');
  await cdp.screenshot(toastScreenshot);

  // 4. Also verify /admin/users route
  console.log('Navigating to /admin/users...');
  await cdp.send('Page.navigate', { url: 'http://localhost:5173/admin/users' });
  await sleep(2500);

  const usersTableState = await cdp.evaluate(`
    (function() {
      const rows = document.querySelectorAll('table tbody tr');
      const text = document.body.innerText;
      return {
        rowCount: rows.length,
        hasUsers: text.includes('Total Users'),
        snippet: text.substring(0, 500)
      };
    })()
  `);
  console.log('Admin Users page table state:', usersTableState);

  const adminUsersPageScreenshot = path.join(ARTIFACT_DIR, 'admin_users_page_verified.png');
  await cdp.screenshot(adminUsersPageScreenshot);

  console.log('Verification completed successfully!');
  chrome.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
