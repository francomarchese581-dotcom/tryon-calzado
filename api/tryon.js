import { GoogleGenAI } from "@google/genai";

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

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [
        {
          parts: [
            {
              text: 'Coloca este calzado sobre el pie de la primera imagen. El resultado debe verse fotorrealístico, respetando la perspectiva, iluminación y proporciones del pie. No cambies nada del fondo, solo agregá el calzado.'
            },
            { inlineData: { mimeType: 'image/jpeg', data: footImage } },
            { inlineData: { mimeType: 'image/jpeg', data: shoeImage } }
          ]
        }
      ]
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData);

    if (!imagePart) {
      const textPart = parts.find(p => p.text);
      res.status(500).json({ error: 'Sin imagen: ' + (textPart?.text || JSON.stringify(response)) });
      return;
    }

    res.status(200).json({ result: imagePart.inlineData.data });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
