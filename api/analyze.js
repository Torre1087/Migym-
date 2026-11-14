const MODELS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-3-flash-preview'];
const PROMPT = 'Analiza esta foto de comida. Responde SOLO con JSON: {"name":"plato en español","kcal":n,"protein":n,"carbs":n,"fat":n,"fiber":n,"sugar":n,"items":["alimento"]} con la estimación total del plato visible (kcal y gramos). Si no hay comida, responde {"error":"no_food"}.';
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'config', detail: 'Falta GEMINI_API_KEY en Vercel' });
  const { image, media_type } = req.body || {};
  if (!image) return res.status(400).json({ error: 'no_image' });
  let detail = '';
  for (const m of MODELS) {
    try {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + m + ':generateContent', {
        method: 'POST',
        headers: { 'x-goog-api-key': key, 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: media_type || 'image/jpeg', data: image } }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });
      const d = await r.json();
      if (!r.ok) { detail = m + ' ' + r.status + ': ' + ((d.error && d.error.message) || '').slice(0, 160); continue; }
      const parts = (((d.candidates || [])[0] || {}).content || {}).parts || [];
      const txt = parts.map(x => x.text || '').join('').replace(/```json|```/g, '').trim();
      try { JSON.parse(txt); } catch (e) { detail = m + ': respuesta vacía o no válida'; continue; }
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(txt);
    } catch (e) { detail = m + ': ' + String(e.message || e).slice(0, 120); }
  }
  res.status(502).json({ error: 'api', detail });
};
