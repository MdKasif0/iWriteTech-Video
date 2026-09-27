const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const workspaceDir = path.resolve(__dirname, '..');
const outputDir = path.resolve(__dirname);
const compositionDir = path.join(outputDir, 'composition');
const htmlUrl = 'file://' + path.join(compositionDir, 'index.html');
const soundtrackPath = path.join(outputDir, 'work', 'soundtrack_exact.aac');
const finalMp4Path = path.join(outputDir, 'brag.mp4');
const posterJpgPath = path.join(outputDir, 'brag.jpg');
const posterPngPath = path.join(outputDir, 'brag-poster.png');
const userDataDir = path.join(outputDir, 'work', 'chrome-render-profile');

const FPS = 30;
const DURATION_SEC = 73.45;
const TOTAL_FRAMES = Math.round(DURATION_SEC * FPS); // 2204 frames
const POSTER_FRAME = Math.round(68.0 * FPS); // Frame at t=68.0s (Grand Outro Branding)

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
  console.log('=== Starting iWriteTech Launch Video Renderer ===');
  console.log(`Resolution: 1920x1080 @ ${FPS}fps`);
  console.log(`Duration: ${DURATION_SEC}s (${TOTAL_FRAMES} frames)`);
  console.log(`Soundtrack: ${soundtrackPath}`);
  console.log(`Output: ${finalMp4Path}`);

  fs.mkdirSync(userDataDir, { recursive: true });

  const port = 9555;
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
    console.log('Connected to Chrome DevTools Protocol');

    const newPageRes = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(htmlUrl)}`, { method: 'PUT' });
    const pageTarget = await newPageRes.json();
    console.log('Navigated to:', htmlUrl);

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

    // Wait for fonts & page initialization
    console.log('Waiting for fonts and assets to stabilize...');
    await new Promise(r => setTimeout(r, 2000));
    await cdp.send('Runtime.evaluate', {
      expression: 'document.fonts.ready.then(() => true)',
      awaitPromise: true
    });

    // Start FFmpeg process
    console.log('Spawning FFmpeg encoder...');
    const ffmpegArgs = [
      '-y',
      '-f', 'image2pipe',
      '-vcodec', 'mjpeg',
      '-framerate', String(FPS),
      '-i', '-',
      '-i', soundtrackPath,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      '-movflags', '+faststart',
      finalMp4Path
    ];

    const ffmpeg = spawn('/opt/homebrew/bin/ffmpeg', ffmpegArgs, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let ffmpegErr = '';
    ffmpeg.stderr.on('data', chunk => {
      ffmpegErr += chunk.toString();
    });

    const startTime = Date.now();
    let posterCaptured = false;

    for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
      const t = frame / FPS;

      // Seek all animations in page
      await cdp.send('Runtime.evaluate', {
        expression: `window.seekTo(${t.toFixed(4)})`
      });

      // Capture frame
      const screenshot = await cdp.send('Page.captureScreenshot', {
        format: 'jpeg',
        quality: 95
      });

      const frameBuf = Buffer.from(screenshot.data, 'base64');
      ffmpeg.stdin.write(frameBuf);

      // Save poster frame at t=5.0s (or frame 0 fallback)
      if (frame === POSTER_FRAME || (!posterCaptured && frame === 0)) {
        fs.writeFileSync(posterJpgPath, frameBuf);
        // Also capture uncompressed PNG for high-res poster
        const pngShot = await cdp.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(posterPngPath, Buffer.from(pngShot.data, 'base64'));
        if (frame === POSTER_FRAME) posterCaptured = true;
      }

      if (frame % 60 === 0 || frame === TOTAL_FRAMES - 1) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const percent = Math.round((frame / TOTAL_FRAMES) * 100);
        console.log(`Rendering: frame ${frame}/${TOTAL_FRAMES} (${percent}%) - ${t.toFixed(2)}s [${elapsed}s elapsed]`);
      }
    }

    console.log('Finished capturing all frames. Finalizing video encoding...');
    ffmpeg.stdin.end();

    await new Promise((resolve, reject) => {
      ffmpeg.on('close', code => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg failed with code ${code}:\n${ffmpegErr}`));
      });
      ffmpeg.on('error', reject);
    });

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`Video rendered successfully in ${totalTime}s!`);
    console.log(`Output: ${finalMp4Path}`);
    console.log(`Poster: ${posterJpgPath}`);

  } finally {
    chromeProc.kill('SIGKILL');
  }
}

main().catch(err => {
  console.error('Fatal error during rendering:', err);
  process.exit(1);
});
