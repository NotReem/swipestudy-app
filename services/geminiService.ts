
import { GoogleGenAI, Type } from "@google/genai";
import { Flashcard } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateFlashcards = async (imageBase64: string, folderId: string): Promise<Flashcard[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
          { text: "Extract key concepts, definitions, and questions from these notes into flashcards. JSON array of {front, back}." },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING },
            back: { type: Type.STRING },
          },
          required: ["front", "back"],
        },
      },
    },
  });

  const rawCards = JSON.parse(response.text || "[]");
  return rawCards.map((card: any, index: number) => ({
    ...card,
    id: `card-${Date.now()}-${index}`,
    folderId,
    status: 'new',
    nextReview: Date.now(),
    interval: 0
  }));
};

export const solveWorksheet = async (imageBase64: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
          { text: "Solve this worksheet. Provide clear, step-by-step explanations for every question found in the image. Use Markdown formatting." },
        ],
      },
    ],
  });
  return response.text || "Could not solve worksheet.";
};

export const chatWithStudyAssistant = async (message: string, imageBase64?: string): Promise<string> => {
  const ai = getAI();
  const parts: any[] = [{ text: message }];
  if (imageBase64) {
    parts.unshift({ inlineData: { mimeType: "image/jpeg", data: imageBase64 } });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction: "You are SwipeStudy AI, a brilliant study assistant. You help users summarize notes, explain complex topics, and solve academic problems. Be encouraging and concise."
    }
  });
  return response.text || "I'm having trouble connecting right now.";
};
