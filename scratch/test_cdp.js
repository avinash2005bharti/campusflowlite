import { spawn } from 'child_process';
import fs from 'fs';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--remote-debugging-port=9222',
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  'http://localhost:5173/login',
]);

setTimeout(async () => {
  try {
    const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
    console.log('Open targets:', list.length);
    const ws = new WebSocket(list[0].webSocketDebuggerUrl);
    ws.onopen = () => {
      console.log('WS connected');
      ws.send(JSON.stringify({ id: 1, method: 'Page.captureScreenshot' }));
    };
    ws.onmessage = (e) => {
      const res = JSON.parse(e.data);
      if (res.result?.data) {
        fs.writeFileSync('C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\6cfe95ba-3817-4502-aac0-b4029b3ce7b9\\test_shot.png', Buffer.from(res.result.data, 'base64'));
        console.log('SUCCESS! Screenshot written.');
        chrome.kill();
        process.exit(0);
      }
    };
  } catch (e) {
    console.error(e);
    chrome.kill();
    process.exit(1);
  }
}, 2000);
