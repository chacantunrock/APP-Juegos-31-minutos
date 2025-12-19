
import { GoogleGenAI } from "@google/genai";
import { CharacterId } from "../types";

// Helper to clean output text from common LLM artifacts
const cleanText = (text: string) => text.replace(/["*]/g, '').trim();

/**
 * Gets a short, character-specific feedback message for the user's score.
 */
export const getCharacterFeedback = async (
  character: CharacterId,
  score: number,
  gameName: string
): Promise<string> => {
  // Always create a new instance right before making the call as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Eres el personaje ${character} de la serie "31 Minutos".
    Un niño de 6 años ha terminado de jugar "${gameName}" y obtuvo ${score} puntos.
    Dame un mensaje de felicitación MUY CORTO (máximo 8 palabras).
    Debe sonar exactamente como hablaría ${character}.
    Usa un lenguaje muy sencillo y alegre. Sin asteriscos ni comillas.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return cleanText(response.text) || "¡Felicidades, amigo!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "¡Eres un campeón!";
  }
};

/**
 * Edits an image using Gemini 2.5 Flash Image model.
 */
export const editImageWithGemini = async (
  base64Image: string,
  prompt: string
): Promise<string | null> => {
  // Always create a new instance right before making the call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
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
            text: `Modify this photo: ${prompt}. Style: Bright, colorful, 31 Minutos puppet world, friendly for children, cartoonish.`
          },
        ],
      },
    });

    if (response.candidates && response.candidates[0].content.parts) {
      // Find the image part as it may not be the first part
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
