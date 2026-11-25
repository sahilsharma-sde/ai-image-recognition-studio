import { useCallback, useEffect, useRef } from 'react';

// One long-lived worker: heavy inference never blocks the page. Restarts itself if it crashes.
export function useWorker() {
  const worker = useRef(null);
  const pending = useRef(new Map());
  const seq = useRef(0);

  useEffect(() => {
    const spawn = () => {
      const w = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
      w.onmessage = ({ data }) => {
        const p = pending.current.get(data.id);
        if (!p) return;
        if (data.type === 'progress') return p.onProgress?.(data.progress);
        pending.current.delete(data.id);
        data.type === 'error' ? p.reject(new Error(data.message)) : p.resolve(data.result);
      };
      w.onerror = () => {
        pending.current.forEach((p) => p.reject(new Error('The model worker stopped. Please try again.')));
        pending.current.clear();
        w.terminate();
        worker.current = spawn();
      };
      return w;
    };
    worker.current = spawn();
    return () => worker.current?.terminate();
  }, []);

  return useCallback((task, payload = {}, onProgress) => new Promise((resolve, reject) => {
    const id = ++seq.current;
    pending.current.set(id, { resolve, reject, onProgress });
    worker.current.postMessage({ id, task, ...payload });
  }), []);
}
