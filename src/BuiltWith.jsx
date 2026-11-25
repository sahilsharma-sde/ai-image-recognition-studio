const TOOLS = [
  { id: 'detect', name: 'Object detection', model: 'YOLOS-tiny', note: 'Small transformer detector, fast on CPU.', url: 'https://huggingface.co/Xenova/yolos-tiny' },
  { id: 'cutout', name: 'Background removal', model: 'RMBG-1.4', note: 'Segmentation model that makes the subject transparent.', url: 'https://huggingface.co/briaai/RMBG-1.4' },
  { id: 'caption', name: 'Image description', model: 'ViT-GPT2', note: 'Vision encoder plus language decoder for captions.', url: 'https://huggingface.co/Xenova/vit-gpt2-image-captioning' },
];
const TECH = [
  { name: 'React', why: 'Interface', url: 'https://react.dev' },
  { name: 'Vite', why: 'Build and dev server', url: 'https://vite.dev' },
  { name: 'Transformers.js', why: 'Runs models in the browser', url: 'https://huggingface.co/docs/transformers.js' },
  { name: 'ONNX Runtime Web', why: 'Fast CPU/WebAssembly inference', url: 'https://onnxruntime.ai' },
  { name: 'Web Workers', why: 'Keeps the page smooth', url: 'https://developer.mozilla.org/docs/Web/API/Web_Workers_API' },
  { name: 'Hugging Face Hub', why: 'Hosts the models', url: 'https://huggingface.co' },
];

export default function BuiltWith({ onPick }) {
  return (
    <section className="built" aria-labelledby="built-h">
      <h2 id="built-h">How it is built</h2>
      <h3>Tools and the models behind them</h3>
      <div className="cards">
        {TOOLS.map((t) => (
          <article key={t.id} className="card">
            <h4>{t.name}</h4>
            <p>{t.note}</p>
            <div className="row">
              <a href={t.url} target="_blank" rel="noreferrer">Model: {t.model}</a>
              <button className="ghost" onClick={() => onPick(t.id)}>Try it</button>
            </div>
          </article>
        ))}
      </div>
      <h3>Technology</h3>
      <div className="chips">
        {TECH.map((t) => (
          <a key={t.name} className="chip" href={t.url} target="_blank" rel="noreferrer"><b>{t.name}</b><span>{t.why}</span></a>
        ))}
      </div>
    </section>
  );
}
