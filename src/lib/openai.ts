import OpenAI from "openai";

const openaiApiKey = process.env.OPENAI_API_KEY;

export function getOpenAIClient() {
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey: openaiApiKey });
}

export async function createRulebookEmbedding(input: string) {
  const client = getOpenAIClient();

  return client.embeddings.create({
    model: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
    input
  });
}

export async function createRulesAnswer({ question, context }: { question: string; context: string }) {
  const client = getOpenAIClient();

  return client.chat.completions.create({
    model: process.env.OPENAI_CHAT_MODEL ?? "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "Answer board game rules questions using only the supplied rulebook context. Cite section names when available."
      },
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion:\n${question}`
      }
    ]
  });
}
