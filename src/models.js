// Runs inside the Web Worker. Models load once, then stay in memory; files are cached by the browser (Cache API).
import { pipeline, AutoModel, AutoProcessor, RawImage, env } from '@huggingface/transformers';
env.allowLocalModels = false;

const cache = {};
const once = (key, fn) => (cache[key] ??= fn().catch((e) => { delete cache[key]; throw e; }));
const RMBG = 'briaai/RMBG-1.4';

const getDetector = (cb) => once('detect', () => pipeline('object-detection', 'Xenova/yolos-tiny', { progress_callback: cb }));
const getCaptioner = (cb) => once('caption', () => pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning', { progress_callback: cb }));
const getBg = (cb) => once('bg', async () => [
  await AutoModel.from_pretrained(RMBG, { config: { model_type: 'custom' }, progress_callback: cb }),
  await AutoProcessor.from_pretrained(RMBG, { config: {
    do_normalize: true, do_pad: false, do_rescale: true, do_resize: true,
    image_mean: [0.5, 0.5, 0.5], image_std: [1, 1, 1], feature_extractor_type: 'ImageFeatureExtractor',
    resample: 2, rescale_factor: 0.00392156862745098, size: { width: 1024, height: 1024 } } }),
]);

// Download a tool's model ahead of time, without running it.
export async function warm(tool, cb) {
  if (tool === 'detect') await getDetector(cb);
  if (tool === 'caption') await getCaptioner(cb);
  if (tool === 'cutout') await getBg(cb);
}

export async function detect(url, threshold, cb) {
  return (await getDetector(cb))(url, { threshold, percentage: true });
}

export async function caption(url, cb) {
  const out = await (await getCaptioner(cb))(url, { max_new_tokens: 30 });
  return out[0].generated_text;
}

export async function removeBackground(url, cb) {
  const [model, processor] = await getBg(cb);
  const image = await RawImage.fromURL(url);
  const { pixel_values } = await processor(image);
  const { output } = await model({ input: pixel_values });
  const mask = await RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(image.width, image.height);
  const rgba = image.rgba();
  for (let i = 0; i < mask.data.length; i++) rgba.data[i * 4 + 3] = mask.data[i];
  const canvas = new OffscreenCanvas(image.width, image.height);
  canvas.getContext('2d').putImageData(new ImageData(rgba.data, image.width, image.height), 0, 0);
  return canvas.convertToBlob({ type: 'image/png' });
}
