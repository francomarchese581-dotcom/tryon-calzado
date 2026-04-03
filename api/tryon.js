export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Solo POST' });
    return;
  }

  try {
    const { footImage, shoeImage } = req.body;

    if (!footImage || !shoeImage) {
      res.status(400).json({ error: 'Faltan imágenes' });
      return;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: 'Coloca este calzado sobre el pie de la primera imagen. El resultado debe verse fotorrealístico, respetando la perspectiva, iluminación y proporciones del pie. No cambies nada del fondo, solo agregá el calzado.'
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
      const errorMsg = data.error?.message || JSON.stringify(data);
      res.status(500).json({ error: 'Sin imagen: ' + errorMsg });
      return;
    }

    res.status(200).json({ result: imagePart.inlineData.data });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
