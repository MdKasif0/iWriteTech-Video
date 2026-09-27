const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const outputDir = path.resolve(__dirname);
const compositionDir = path.join(outputDir, 'composition');
const htmlUrl = 'file://' + path.join(compositionDir, 'index.html');
const previewDir = path.join(outputDir, 'work', 'test_previews');
const userDataDir = path.join(outputDir, 'work', 'chrome-test-profile');

fs.mkdirSync(previewDir, { recursive: true });
fs.mkdirSync(userDataDir, { recursive: true });

async function getWsUrl(port) {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      const data = await res.json();
      return data.webSocketDebuggerUrl;
    } catch (e) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  throw new Error('Chrome CDP port not responding');
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
  }

  async waitOpen() {
    if (this.ws.readyState === WebSocket.OPEN) return;
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

async function main() {
  const port = 9556;
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--window-size=1920,1080',
    '--hide-scrollbars',
    '--enable-font-antialiasing',
    '--font-render-hinting=max',
    '--disable-gpu',
    'about:blank'
  ]);

  try {
    const wsUrl = await getWsUrl(port);
    const newPageRes = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(htmlUrl)}`, { method: 'PUT' });
    const pageTarget = await newPageRes.json();
    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.waitOpen();

    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false
    });

    await new Promise(r => setTimeout(r, 2000));
    await cdp.send('Runtime.evaluate', {
      expression: 'document.fonts.ready.then(() => true)',
      awaitPromise: true
    });

    const testTimestamps = [
      { t: 2.0, name: 'scene1_kinetic_tokens.jpg' },
      { t: 5.0, name: 'scene1_brand_reveal.jpg' },
      { t: 9.5, name: 'scene2_floating_viewport.jpg' },
      { t: 15.2, name: 'scene3_snapped_pills.jpg' },
      { t: 18.5, name: 'scene3_acoustic_lab.jpg' },
      { t: 23.5, name: 'scene4_mobile_report.jpg' },
      { t: 26.0, name: 'scene4_terminal_command.jpg' },
      { t: 30.5, name: 'scene5_ai_3d_keyboard.jpg' },
      { t: 33.5, name: 'scene5_approval_click.jpg' },
      { t: 38.0, name: 'scene6_diagnostic_card.jpg' },
      { t: 40.5, name: 'scene6_shield_matrix.jpg' },
      { t: 44.0, name: 'scene7_master_dashboard.jpg' },
      { t: 49.0, name: 'scene8_climactic_outro.jpg' }
    ];

    for (const item of testTimestamps) {
      await cdp.send('Runtime.evaluate', {
        expression: `window.seekTo(${item.t})`
      });
      // Short pause for CSS paint
      await new Promise(r => setTimeout(r, 120));

      const screenshot = await cdp.send('Page.captureScreenshot', {
        format: 'jpeg',
        quality: 95
      });

      const filePath = path.join(previewDir, item.name);
      fs.writeFileSync(filePath, Buffer.from(screenshot.data, 'base64'));
      console.log(`Saved preview: ${item.name} at t=${item.t}s`);
    }

    console.log('All test previews captured successfully!');
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
