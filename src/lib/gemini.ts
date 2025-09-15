import { GoogleGenerativeAI } from "@google/generative-ai";

export async function summarizeNote(text: string): Promise<string> {
  if (!text) return "";
  const apiKey = process.env.GOOGLE_API_KEY as string | undefined;
  if (!apiKey) return "";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Aşağıdaki satış görüşmesi notunu 2-3 cümlede özetle: ${text}`;
  const res = await model.generateContent(prompt);
  const out = res.response.text();
  return out || "";
}


