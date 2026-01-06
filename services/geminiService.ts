
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Flashcard, TestQuestion, QuestionType } from "../types";

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
          { text: "Extract key concepts, definitions, and questions from these notes into flashcards. JSON array of {front, back}. Respond ONLY in English." },
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
    interval: 0,
    masteryScore: 0
  }));
};

export const generateFlashcardsFromText = async (notes: string, folderId: string): Promise<Flashcard[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ 
      role: "user", 
      parts: [{ text: `Transform these notes into a comprehensive set of flashcards. JSON array of {front, back}. notes: ${notes}` }] 
    }],
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
    id: `card-txt-${Date.now()}-${index}`,
    folderId,
    status: 'new',
    nextReview: Date.now(),
    interval: 0,
    masteryScore: 0
  }));
};

export const evaluateAnswer = async (question: string, correctAnswer: string, userAnswer: string): Promise<{ isCorrect: boolean; feedback: string }> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{
      role: "user",
      parts: [{ text: `Act as a teacher. Evaluate if the student's answer is conceptually correct.
      Question: ${question}
      Official Answer: ${correctAnswer}
      Student Answer: ${userAnswer}
      
      Respond with JSON: { "isCorrect": boolean, "feedback": "One short sentence explaining why or encouraging." }` }]
    }],
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || '{"isCorrect":false, "feedback": "Error evaluating"}');
};

export const generatePracticeTest = async (cards: Flashcard[], types: QuestionType[], count: number): Promise<TestQuestion[]> => {
  const ai = getAI();
  const cardData = cards.map(c => `Q: ${c.front} | A: ${c.back}`).join('\n');
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{
      role: "user",
      parts: [{ text: `Generate a practice test from these cards. 
      Length: ${count} questions. 
      Allowed Question Types: ${types.join(', ')}.
      
      Cards:
      ${cardData}
      
      Return a JSON array of TestQuestion objects: { "id": "string", "type": "multiple-choice"|"true-false"|"written", "question": "string", "options": ["string"], "correctAnswer": "string" }` }]
    }],
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "[]");
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
      systemInstruction: "You are SwipeStudy AI. You respond ONLY in English. Be academic, concise, and helpful."
    }
  });
  return response.text || "I'm having trouble connecting.";
};

// Fix: Added missing solveWorksheet function to handle complex worksheet solving tasks
export const solveWorksheet = async (imageBase64: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
        { text: "Solve this worksheet step-by-step. Provide clear explanations for each problem. Respond ONLY in English using Markdown formatting." }
      ]
    }
  });
  return response.text || "I was unable to solve the worksheet. Please try a clearer image.";
};
