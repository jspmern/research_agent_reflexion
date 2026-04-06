import { ChatOpenAI } from "@langchain/openai";

 
export const llm = new ChatOpenAI({
  model: "gpt-5.4-nano-2026-03-17",
  temperature: 0.5,
  // other params...
})