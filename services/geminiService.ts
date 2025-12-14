import { GoogleGenAI } from "@google/genai";
import { CharacterId } from "../types";

const apiKey = process.env.API_KEY || '';

let ai: GoogleGenAI | null = null;

try {
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey: apiKey });
  }
} catch (e) {
  console.error("Error initializing Gemini client", e);
}

export const getCharacterFeedback = async (
  character: CharacterId,
  score: number,
  gameName: string
): Promise<string> => {
  if (!ai) {
    return "¡Muy bien jugado!";
  }

  // Adjusted prompt for 6-7 year olds who can't read well (audio focus)
  const prompt = `
    Eres ${character} de 31 Minutos.
    Un niño de 6 años jugó "${gameName}" y logró ${score} puntos.
    Dame una frase MUY CORTA (máximo 10 palabras).
    Debe ser fácil de leer en voz alta, divertida y motivadora.
    Usa lenguaje sencillo.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text?.replace(/["*]/g, '') || "¡Eres genial!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "¡Eres un campeón!";
  }
};

export const editImageWithGemini = async (
  base64Image: string,
  prompt: string
): Promise<string | null> => {
  if (!ai) return null;

  try {
    // Remove header if present
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: `Edit this image: ${prompt}. Maintain the style fun and suitable for children.`
          },
        ],
      },
    });

    // Extract image from response
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Edit Error:", error);
    return null;
  }
};