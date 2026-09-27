const { spawn } = require('child_process');
const path = require('path');

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const htmlUrl = 'file://' + path.resolve(__dirname, 'composition', 'index.html');
const userDataDir = path.resolve(__dirname, 'work', 'chrome-diag-profile');

async function getWsUrl(port) {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      const data = await res.json();
      return data.webSocketDebuggerUrl;
    } catch (e) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  throw new Error('Port not responding');
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
      }
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

async function run() {
  const port = 9557;
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--window-size=1920,1080',
    'about:blank'
  ]);

  try {
    const wsUrl = await getWsUrl(port);
    const newPageRes = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(htmlUrl)}`, { method: 'PUT' });
    const pageTarget = await newPageRes.json();
    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.waitOpen();

    await cdp.send('Runtime.enable');
    await cdp.send('Page.enable');

    await new Promise(r => setTimeout(r, 1500));

    // Test seekTo for different timestamps
    for (const t of [1.0, 3.0, 5.5, 10.0, 18.0, 28.0, 37.0, 42.0, 45.0]) {
      const evalRes = await cdp.send('Runtime.evaluate', {
        expression: `
          (() => {
            window.seekTo(${t});
            const s1 = document.getElementById('scene1');
            const s5 = document.getElementById('scene5');
            const s6 = document.getElementById('scene6');
            const phone = document.getElementById('scene1-phone');
            const card5 = document.getElementById('scene5-card');
            const brand6 = document.getElementById('scene6-brand');
            const p6 = document.getElementById('scene6-punchline');
            return {
              t: ${t},
              s1_opacity: window.getComputedStyle(s1).opacity,
              s5_opacity: window.getComputedStyle(s5).opacity,
              s6_opacity: window.getComputedStyle(s6).opacity,
              phone_opacity: phone ? window.getComputedStyle(phone).opacity : null,
              phone_display: phone ? window.getComputedStyle(phone).display : null,
              phone_bounds: phone ? phone.getBoundingClientRect() : null,
              card5_opacity: card5 ? window.getComputedStyle(card5).opacity : null,
              brand6_opacity: brand6 ? window.getComputedStyle(brand6).opacity : null,
              p6_opacity: p6 ? window.getComputedStyle(p6).opacity : null,
            };
          })()
        `,
        returnByValue: true
      });
      console.log(`t=${t}s:`, evalRes.result.value);
    }
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

run().catch(console.error);
