import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;

// mega LLm

export const megaLLM = new OpenAI({
  baseURL: process.env.MEGA_BASE_URL,
  apiKey: process.env.MEGA_API_KEY,
});

export const gemini = new OpenAI({
  baseURL: process.env.GEMINI_BASE_URL,
  apiKey: process.env.GEMINI_API_KEY,
});
