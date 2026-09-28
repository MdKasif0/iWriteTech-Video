const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const outputDir = path.resolve(__dirname);
const compositionDir = path.join(outputDir, 'composition');
const htmlUrl = 'file://' + path.join(compositionDir, 'index.html');
const previewDir = path.join(outputDir, 'work', 'test_previews_ref5');
const userDataDir = path.join(outputDir, 'work', 'chrome-test-ref5-profile');

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
  const port = 9558;
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
      { t: 4.0, name: 'scene1_spark_sanctuary.jpg' },
      { t: 16.0, name: 'scene2_acoustic_vortex.jpg' },
      { t: 25.0, name: 'scene3_dendritic_tree.jpg' },
      { t: 34.0, name: 'scene4_curation_mask.jpg' },
      { t: 45.0, name: 'scene5_spacetime_core.jpg' },
      { t: 55.0, name: 'scene6_laser_switch.jpg' },
      { t: 65.0, name: 'scene7_acoustic_chamber.jpg' },
      { t: 76.0, name: 'scene8_form_certification.jpg' },
      { t: 88.0, name: 'scene9_gantt_laser_timeline.jpg' },
      { t: 97.0, name: 'scene10_chrome_artisan.jpg' },
      { t: 105.0, name: 'scene11_burning_fuse.jpg' },
      { t: 115.0, name: 'scene12_exploded_architecture.jpg' },
      { t: 125.0, name: 'scene13_circadian_horizon.jpg' },
      { t: 135.0, name: 'scene14_volumetric_display.jpg' },
      { t: 145.0, name: 'scene15_score_countdown.jpg' },
      { t: 154.5, name: 'scene16_climax_brand_click.jpg' }
    ];

    for (const item of testTimestamps) {
      const evalRes = await cdp.send('Runtime.evaluate', {
        expression: `
          (() => {
            try {
              window.seekTo(${item.t});
              return { success: true };
            } catch(e) {
              return { error: e.message, stack: e.stack };
            }
          })()
        `,
        returnByValue: true
      });

      if (evalRes.result.value && evalRes.result.value.error) {
        console.error(`Error at t=${item.t}s:`, evalRes.result.value.error);
      }

      await new Promise(r => setTimeout(r, 120));

      const screenshot = await cdp.send('Page.captureScreenshot', {
        format: 'jpeg',
        quality: 95
      });

      const filePath = path.join(previewDir, item.name);
      fs.writeFileSync(filePath, Buffer.from(screenshot.data, 'base64'));
      console.log(`Saved preview: ${item.name} at t=${item.t}s`);
    }

    console.log('All Reference 5 test previews captured successfully!');
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
