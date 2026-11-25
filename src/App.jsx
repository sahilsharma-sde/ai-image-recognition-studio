import { useEffect, useRef, useState } from 'react';
import { useWorker } from './useWorker.js';
import BuiltWith from './BuiltWith.jsx';
import { AUTHOR, INSTITUTE, INSTITUTE_URL } from './brand.js';

const SAMPLE = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/city-streets.jpg';
const MAX_SIDE = 1280; // downscale big photos: faster inference, same results for these models
const TOOLS = [
  { id: 'detect', name: 'Detect objects', hint: 'Finds and labels what is in the photo.', run: 'Detect objects' },
  { id: 'cutout', name: 'Remove background', hint: 'Cuts the subject out as a transparent PNG.', run: 'Remove background' },
  { id: 'caption', name: 'Describe image', hint: 'Writes a one-line description, useful as alt text.', run: 'Describe image' },
];

async function prepare(input) {
  const blob = typeof input === 'string' ? await (await fetch(input)).blob() : input;
  const bmp = await createImageBitmap(blob);
  const s = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  const type = blob.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const out = await new Promise((r) => c.toBlob(r, type, 0.92));
  return URL.createObjectURL(out);
}

export default function App() {
  const call = useWorker();
  const [src, setSrc] = useState(null);
  const [tool, setTool] = useState('detect');
  const [threshold, setThreshold] = useState(0.7);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [ms, setMs] = useState(null);
  const fileRef = useRef();
  const prev = useRef({ src: null, cut: null });

  // Start downloading the selected tool's model in the background, so Run feels instant.
  useEffect(() => { call('warm', { tool }).catch(() => {}); }, [tool, call]);

  const free = (key, url) => { if (prev.current[key]) URL.revokeObjectURL(prev.current[key]); prev.current[key] = url; };

  async function pick(input) {
    setResult(null); setError(''); setMs(null);
    try { const url = await prepare(input); free('src', url); setSrc(url); }
    catch { setError('That image could not be opened. Try a JPG or PNG file.'); }
  }

  async function run() {
    setBusy(true); setError(''); setResult(null); setProgress(null);
    const t0 = performance.now();
    try {
      const out = await call(tool, { url: src, threshold }, setProgress);
      if (tool === 'cutout') { const url = URL.createObjectURL(out); free('cut', url); setResult({ type: 'cutout', url }); }
      else setResult({ type: tool, ...(tool === 'detect' ? { items: out } : { text: out }) });
      setMs(Math.round(performance.now() - t0));
    } catch (e) {
      setError('Could not run this tool. Check your connection (models download on first use) and try again.');
      console.error(e);
    } finally { setBusy(false); setProgress(null); }
  }

  const current = TOOLS.find((t) => t.id === tool);
  return (
    <div className="studio">
      <header>
        <h1>AI Image Recognition Studio</h1>
        <p>Everything runs in your browser. Your photos are never uploaded.</p>
      </header>

      <nav className="rail" aria-label="Tools">
        {TOOLS.map((t) => (
          <button key={t.id} className={t.id === tool ? 'on' : ''} onClick={() => { setTool(t.id); setResult(null); setError(''); }}>
            <b>{t.name}</b><span>{t.hint}</span>
          </button>
        ))}
      </nav>

      <main className="stage" onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); e.dataTransfer.files[0] && pick(e.dataTransfer.files[0]); }}>
        {!src ? (
          <div className="drop">
            <p>Drop a photo here</p>
            <div>
              <button onClick={() => fileRef.current.click()}>Choose a file</button>
              <button className="ghost" onClick={() => pick(SAMPLE)}>Try a sample</button>
            </div>
          </div>
        ) : result?.type === 'cutout' ? (
          <div className="frame checker"><img src={result.url} alt="Background removed" /></div>
        ) : (
          <div className="frame">
            <img src={src} alt="Your upload" />
            {result?.type === 'detect' && result.items.map((d, i) => (
              <div key={i} className="box" style={{
                left: `${d.box.xmin * 100}%`, top: `${d.box.ymin * 100}%`,
                width: `${(d.box.xmax - d.box.xmin) * 100}%`, height: `${(d.box.ymax - d.box.ymin) * 100}%` }}>
                <span>{d.label} {Math.round(d.score * 100)}%</span>
              </div>
            ))}
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files[0] && pick(e.target.files[0])} />
      </main>

      <aside className="panel" aria-live="polite">
        <h2>{current.name}</h2>
        {tool === 'detect' && (
          <label>Minimum confidence: {Math.round(threshold * 100)}%
            <input type="range" min="0.3" max="0.95" step="0.05" value={threshold} onChange={(e) => setThreshold(+e.target.value)} />
          </label>
        )}
        <button className="primary" disabled={!src || busy} onClick={run}>
          {busy ? (progress != null ? `Loading model ${progress}%` : 'Working…') : current.run}
        </button>
        {src && <button className="ghost" disabled={busy} onClick={() => { setSrc(null); setResult(null); }}>Choose another photo</button>}
        {error && <p className="err">{error}</p>}
        {ms && <p className="meta">Finished in {(ms / 1000).toFixed(1)} s</p>}
        {result?.type === 'detect' && (result.items.length
          ? <ul>{result.items.map((d, i) => <li key={i}>{d.label}<em>{Math.round(d.score * 100)}%</em></li>)}</ul>
          : <p>No objects found. Try lowering the confidence.</p>)}
        {result?.type === 'caption' && <p className="caption">{result.text}</p>}
        {result?.type === 'cutout' && <a className="primary" href={result.url} download="cutout.png">Download PNG</a>}
      </aside>

      <BuiltWith onPick={(id) => { setTool(id); setResult(null); setError(''); window.scrollTo({ top: 0 }); }} />

      <footer>Built by {AUTHOR} at <a href={INSTITUTE_URL}>{INSTITUTE}</a>. Models run locally in your browser, so the first use of each tool takes a moment to download.</footer>
    </div>
  );
}
