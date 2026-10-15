import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe';
const PORT = 9222;
const OUTPUT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\6cfe95ba-3817-4502-aac0-b4029b3ce7b9\\screenshots';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function loginHOD() {
  const res = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hod@campusflow.edu', password: 'Password@123' }),
  });
  const data = await res.json();
  if (!data.success) throw new Error('Login failed: ' + JSON.stringify(data));
  return {
    token: data.data.accessToken,
    user: data.data.user,
  };
}

function launchChrome() {
  const tmpDir = path.join(OUTPUT_DIR, 'tmp_chrome_profile');
  const chromeProcess = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tmpDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1440,960',
    'about:blank',
  ]);
  return chromeProcess;
}

async function waitForCdpUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const data = await res.json();
      if (data.webSocketDebuggerUrl) return data.webSocketDebuggerUrl;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  throw new Error('CDP not ready after 6s');
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(msg.error);
          else cb.resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async close() {
    this.ws.close();
  }
}

async function run() {
  console.log('1. Logging in as HOD to get session token...');
  const { token, user } = await loginHOD();
  console.log('HOD Token obtained:', token.slice(0, 15) + '...');

  console.log('2. Launching Chrome headless on port ' + PORT + '...');
  const chromeProc = launchChrome();

  try {
    const wsUrl = await waitForCdpUrl();
    console.log('CDP WebSocket URL:', wsUrl);

    // Get target page websocket URL
    const listRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const pages = await listRes.json();
    const pageWsUrl = pages[0]?.webSocketDebuggerUrl;

    const client = new CDPClient(pageWsUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Runtime.enable');

    // Wait 1.5s for page to load
    await new Promise((r) => setTimeout(r, 1500));

    // Inject localStorage
    const script = `
      localStorage.setItem('campusflow_token', ${JSON.stringify(token)});
      localStorage.setItem('campusflow_role', 'hod');
      localStorage.setItem('campusflow_user', ${JSON.stringify(JSON.stringify(user))});
    `;
    await client.send('Runtime.evaluate', { expression: script });
    console.log('Injected auth token into localStorage.');

    // Helper to navigate and screenshot
    const capture = async (url, filename, waitMs = 2000, evalBefore = null) => {
      console.log(`Navigating to ${url}...`);
      await client.send('Page.navigate', { url });
      await new Promise((r) => setTimeout(r, waitMs));

      if (evalBefore) {
        await client.send('Runtime.evaluate', { expression: evalBefore });
        await new Promise((r) => setTimeout(r, 800));
      }

      const shot = await client.send('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(shot.data, 'base64');
      const filepath = path.join(OUTPUT_DIR, filename);
      fs.writeFileSync(filepath, buffer);
      console.log(`Saved screenshot: ${filepath}`);
    };

    // 1. Student Directory matching Image 1
    await capture('http://localhost:5173/hod/students', '01_students_directory.png', 2000);

    // 2. View Consideration modal matching Image 2
    await capture(
      'http://localhost:5173/hod',
      '02_view_consideration_modal.png',
      2000,
      `
      const btns = Array.from(document.querySelectorAll('button'));
      const viewBtn = btns.find(b => b.textContent.includes('View Consideration'));
      if (viewBtn) viewBtn.click();
    `
    );

    // 3. Print Semester Modal matching Image 3
    await capture(
      'http://localhost:5173/hod',
      '03_select_semester_print_modal.png',
      2000,
      `
      const btns = Array.from(document.querySelectorAll('button'));
      const viewBtn = btns.find(b => b.textContent.includes('View Consideration'));
      if (viewBtn) viewBtn.click();
      setTimeout(() => {
        const pBtns = Array.from(document.querySelectorAll('button'));
        const printBtn = pBtns.find(b => b.textContent.includes('print report'));
        if (printBtn) printBtn.click();
      }, 500);
    `
    );

    // 4. Considerations & Leave Ledger
    await capture('http://localhost:5173/hod/considerations', '04_considerations_ledger.png', 2000);

    // 5. Mentorship Management
    await capture('http://localhost:5173/hod/mentorship', '05_mentorship_directory.png', 2000);

    await client.close();
    console.log('All screenshots captured successfully!');
  } finally {
    chromeProc.kill();
  }
}

run().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
