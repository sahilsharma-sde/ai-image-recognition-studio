import { detect, caption, removeBackground, warm } from './models.js';

self.onmessage = async ({ data }) => {
  const { id, task, url, threshold, tool } = data;
  const progress = (p) => p.status === 'progress' && self.postMessage({ id, type: 'progress', progress: Math.round(p.progress) });
  try {
    let result = true;
    if (task === 'warm') await warm(tool, progress);
    if (task === 'detect') result = await detect(url, threshold, progress);
    if (task === 'caption') result = await caption(url, progress);
    if (task === 'cutout') result = await removeBackground(url, progress);
    self.postMessage({ id, type: 'done', result });
  } catch (e) {
    self.postMessage({ id, type: 'error', message: String(e?.message || e) });
  }
};
