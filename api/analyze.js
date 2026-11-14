module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  try {
    const { image, media_type } = req.body || {};
    if (!image) return res.status(400).json({ error: 'no_image' });
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: 'Analiza esta foto de comida. Responde SOLO con JSON: {"name":"plato en español","kcal":n,"protein":n,"carbs":n,"fat":n,"fiber":n,"sugar":n,"items":["alimento"]} con la estimación total del plato visible (kcal y gramos). Si no hay comida, responde {"error":"no_food"}.' },
          { inline_data: { mime_type: media_type || 'image/jpeg', data: image } }
        ] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });
    const d = await r.json();
    const t = (((d.candidates || [])[0] || {}).content || {}).parts;
    const txt = (t || []).map(x => x.text || '').join('').replace(/```json|```/g, '').trim();
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(txt || '{"error":"fail"}');
  } catch (e) { res.status(500).json({ error: 'fail' }); }
};
