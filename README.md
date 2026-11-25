# AI Image Recognition Studio
React + Vite + Transformers.js. Runs fully in the browser (no GPU, no backend).

    npm install
    npm run dev      # open the printed local URL
    npm run build    # static site in dist/, deploy to Vercel/Netlify/Cloudflare Pages

Models download from Hugging Face on first use of each tool, then are cached by the browser.
Tools: object detection (YOLOS-tiny), background removal (RMBG-1.4), captioning (ViT-GPT2).

## Before you deploy
1. Edit `src/brand.js` (your name, institute, link).
2. `npm run build`, then deploy `dist/` (Vercel, Netlify or Cloudflare Pages; hashed assets are cached for a year via `vercel.json` / `public/_headers`).
3. Open the live URL on a phone and try every tool once.

## Why it stays smooth
- Inference runs in a Web Worker, so the page never freezes.
- Photos are downscaled to 1280px before inference.
- The selected tool's model downloads in the background and is cached by the browser for return visits.
