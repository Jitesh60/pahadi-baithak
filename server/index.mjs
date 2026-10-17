import { createApp } from './lib/app.mjs';
import { r2Store } from './lib/store.mjs';
import { fetchAudio } from './lib/youtube.mjs';

const port = Number(process.env.PORT || 8787);
const origins = (process.env.ALLOWED_ORIGINS || 'http://localhost:8080')
  .split(',').map((s) => s.trim()).filter(Boolean);

createApp({
  token: process.env.LIBRARY_TOKEN,
  origins,
  store: r2Store(),
  fetchAudio,
}).listen(port, () => console.log(`library API on :${port} for ${origins.join(', ')}`));
