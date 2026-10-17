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
  const profileDir = path.join(ARTIFACT_DIR, 'tmp_chrome_hod_verify');
  if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

  const chrome = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profileDir}`,
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--window-size=1440,960',
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

  // Click HOD tab and sign in
  console.log('Selecting HOD portal...');
  await cdp.evaluate(`
    (function() {
      const buttons = Array.from(document.querySelectorAll('button'));
      const hodTab = buttons.find(b => b.textContent.trim() === 'HOD' || b.textContent.includes('HOD'));
      if (hodTab) hodTab.click();
    })()
  `);
  await sleep(600);

  console.log('Submitting login...');
  await cdp.evaluate(`
    (function() {
      const submitBtn = document.querySelector('button[type="submit"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sign In'));
      if (submitBtn) submitBtn.click();
    })()
  `);
  await sleep(3500);

  // Navigate to HOD Considerations
  console.log('Navigating to http://localhost:5173/hod/considerations...');
  await cdp.send('Page.navigate', { url: 'http://localhost:5173/hod/considerations' });
  await sleep(2500);

  // Capture full page and verification screenshot
  const hodConsiderationsScreenshot = path.join(ARTIFACT_DIR, 'hod_considerations_updated_verified.png');
  await cdp.screenshot(hodConsiderationsScreenshot);

  // Scroll down to show group roster highlighted
  await cdp.evaluate(`window.scrollTo({ top: 350, behavior: 'instant' });`);
  await sleep(600);
  const rosterScreenshot = path.join(ARTIFACT_DIR, 'hod_considerations_roster_highlighted.png');
  await cdp.screenshot(rosterScreenshot);

  // Evaluate DOM order
  const checkResult = await cdp.evaluate(`
    (function() {
      const text = document.body.innerText;
      const allRequestsIdx = text.indexOf('All Requests');
      const semesterIdx = text.indexOf('Semester:');
      const hasLiveSheet = text.includes('Live Sheet');
      const hasExportExcel = text.includes('Export Excel');
      const studentPills = Array.from(document.querySelectorAll('.bg-amber-200\\\\/90, [class*="bg-amber-200"]')).length;
      return {
        allRequestsIdx,
        semesterIdx,
        tabsBeforeSemester: allRequestsIdx < semesterIdx,
        hasLiveSheet,
        hasExportExcel,
        studentPillsCount: studentPills
      };
    })()
  `);
  console.log('Check result:', checkResult);

  console.log('HOD Considerations verification completed!');
  chrome.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error('HOD verification failed:', err);
  process.exit(1);
});
