export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Solo POST' }); return; }
 
  try {
    const { footImage, shoeImage } = req.body;
 
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: 'Coloca este calzado sobre el pie de la primera imagen. El resultado debe verse fotorrealístico, respetando la perspectiva, iluminación y proporciones originales del pie. No cambies nada del pie ni del fondo, solo agregá el calzado.'
              },
              { inline_data: { mime_type: 'image/jpeg', data: footImage } },
              { inline_data: { mime_type: 'image/jpeg', data: shoeImage } }
            ]
          }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
        })
      }
    );
 
    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData);
 
    if (!imagePart) {
      res.status(500).json({ error: 'La IA no devolvió imagen. Intentá de nuevo.' });
      return;
    }
 
    res.status(200).json({ result: imagePart.inlineData.data });
 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
 
