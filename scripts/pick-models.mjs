// Builds the model list for "Test the library": models.json plus, optionally, models discovered
// from OpenRouter's public model list (no key needed) using a filter such as ":free" or "openai/,google/".
import fs from 'node:fs';
const lib = JSON.parse(fs.readFileSync('models.json', 'utf8')).models || [];
const filter = (process.env.DISCOVER || '').trim();
const limit = Math.max(1, Math.min(100, +process.env.LIMIT || 10));
let out = lib.map(m => ({ id: m.id, label: m.label || m.id, access: m.access || 'API (pay per use)' }));
if (filter) {
  const r = await fetch('https://openrouter.ai/api/v1/models'); const j = await r.json();
  const terms = filter.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const found = (j.data || []).filter(m => terms.some(t => m.id.toLowerCase().includes(t)))
    .filter(m => (m.architecture?.output_modalities || ['text']).includes('text'))
    .sort((a, b) => (b.created || 0) - (a.created || 0)).slice(0, limit)
    .map(m => ({ id: m.id, label: m.name || m.id, access: m.id.endsWith(':free') ? 'API (free tier)' : 'API (pay per use)' }));
  for (const m of found) if (!out.some(x => x.id === m.id)) out.push(m);
}
console.log(JSON.stringify(out));
