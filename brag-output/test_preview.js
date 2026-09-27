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
      { t: 1.0, name: 'scene1_orb.jpg' },
      { t: 3.5, name: 'scene1_prompt_typing.jpg' },
      { t: 5.6, name: 'scene1_button_click.jpg' },
      { t: 9.5, name: 'scene2_hardware_specimen.jpg' },
      { t: 15.5, name: 'scene3_acoustic_spectrogram.jpg' },
      { t: 19.5, name: 'scene3_master_lab.jpg' },
      { t: 24.5, name: 'scene4_sync_capsule.jpg' },
      { t: 27.5, name: 'scene4_split_telemetry.jpg' },
      { t: 35.0, name: 'scene5_curate_manifesto.jpg' },
      { t: 45.0, name: 'scene6_dark_prompt.jpg' },
      { t: 48.5, name: 'scene6_atmospheric_monitor.jpg' },
      { t: 52.5, name: 'scene7_brand_reveal.jpg' },
      { t: 55.0, name: 'scene7_punchline.jpg' }
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
