const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const outputDir = path.resolve(__dirname);
const compositionDir = path.join(outputDir, 'composition');
const htmlUrl = 'file://' + path.join(compositionDir, 'index.html');
const previewDir = path.join(outputDir, 'work', 'test_previews_ref6');
const userDataDir = path.join(outputDir, 'work', 'chrome-test-ref6-profile');

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

async function testPreviews() {
  const port = 9559;
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--window-size=1920,1080',
    '--hide-scrollbars',
    '--enable-font-antialiasing',
    '--font-render-hinting=max',
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

    await new Promise(r => setTimeout(r, 1500));
    await cdp.send('Runtime.evaluate', {
      expression: 'document.fonts.ready.then(() => true)',
      awaitPromise: true
    });

    const testTimes = [
      { t: 1.0, name: 'scene1_introducing_velocity.jpg' },
      { t: 3.0, name: 'scene2_sanctuary_fan.jpg' },
      { t: 4.5, name: 'scene2_most_refined_punch.jpg' },
      { t: 7.0, name: 'scene3_benchmark_velocity.jpg' },
      { t: 10.5, name: 'scene4_fraction_of_cost.jpg' },
      { t: 14.5, name: 'scene5_pro_quality_calibrated.jpg' },
      { t: 18.0, name: 'scene6_build_fast_mosaic.jpg' },
      { t: 21.0, name: 'scene7_iwritetech_finale.jpg' }
    ];

    for (const item of testTimes) {
      await cdp.send('Runtime.evaluate', {
        expression: `window.seekTo(${item.t})`
      });
      await new Promise(r => setTimeout(r, 100));

      const screenshot = await cdp.send('Page.captureScreenshot', {
        format: 'jpeg',
        quality: 95
      });
      const savePath = path.join(previewDir, item.name);
      fs.writeFileSync(savePath, Buffer.from(screenshot.data, 'base64'));
      console.log(`Saved preview: ${item.name} at t=${item.t}s`);
    }

    console.log('All Reference 6 test previews captured successfully!');
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

testPreviews().catch(err => {
  console.error('Preview error:', err);
  process.exit(1);
});
