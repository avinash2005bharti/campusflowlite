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
  const profileDir = path.join(ARTIFACT_DIR, 'tmp_chrome_verify_2');
  if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

  const chrome = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profileDir}`,
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--window-size=1440,1050',
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
    console.error('Failed to connect to Chrome.');
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

  // Click Admin tab and sign in
  await cdp.evaluate(`
    (function() {
      const buttons = Array.from(document.querySelectorAll('button'));
      const adminTab = buttons.find(b => b.textContent.trim() === 'Admin' || b.textContent.includes('Admin'));
      if (adminTab) adminTab.click();
    })()
  `);
  await sleep(800);

  await cdp.evaluate(`
    (function() {
      const submitBtn = document.querySelector('button[type="submit"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sign In'));
      if (submitBtn) submitBtn.click();
    })()
  `);
  await sleep(3500);

  // 1. Capture Accounts Directory scrolled into view on Admin Dashboard
  console.log('Scrolling Admin Dashboard down to Institutional Accounts Directory...');
  await cdp.evaluate(`window.scrollTo({ top: 550, behavior: 'instant' });`);
  await sleep(800);

  const adminStudentsTableScreenshot = path.join(ARTIFACT_DIR, 'admin_students_table_in_view.png');
  await cdp.screenshot(adminStudentsTableScreenshot);

  // Click Faculty Accounts tab in directory
  await cdp.evaluate(`
    (function() {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Faculty Accounts'));
      if (btn) btn.click();
    })()
  `);
  await sleep(800);

  const adminFacultyTableScreenshot = path.join(ARTIFACT_DIR, 'admin_faculty_table_in_view.png');
  await cdp.screenshot(adminFacultyTableScreenshot);

  // 2. Test Notification Dropdown Scrolling
  console.log('Opening notifications dropdown...');
  // Scroll back to top
  await cdp.evaluate(`window.scrollTo({ top: 0, behavior: 'instant' });`);
  await sleep(400);

  await cdp.evaluate(`
    (function() {
      const notifBtn = document.querySelector('button[aria-label="View notifications"]') || document.querySelector('button[title="Notifications"]');
      if (notifBtn) notifBtn.click();
    })()
  `);
  await sleep(1000);

  // Dispatch mouse wheel events or set scroll position instantly
  console.log('Dispatching scroll to bottom of notification list...');
  const scrollResult = await cdp.evaluate(`
    (function() {
      const scrollEl = document.querySelector('.notification-dropdown-scroll');
      if (!scrollEl) return { success: false, reason: 'Element not found' };
      // Scroll halfway or to bottom
      scrollEl.style.scrollBehavior = 'auto';
      scrollEl.scrollTop = 500;
      return {
        success: true,
        scrollHeight: scrollEl.scrollHeight,
        clientHeight: scrollEl.clientHeight,
        scrollTop: scrollEl.scrollTop
      };
    })()
  `);
  console.log('Scroll result:', scrollResult);
  await sleep(600);

  const notifScrolledSuccessScreenshot = path.join(ARTIFACT_DIR, 'notification_dropdown_scrolled_success.png');
  await cdp.screenshot(notifScrolledSuccessScreenshot);

  console.log('Finished visual verification!');
  chrome.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
