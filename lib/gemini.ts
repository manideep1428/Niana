import { GoogleGenAI, Type } from "@google/genai";

export const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export { Type };
