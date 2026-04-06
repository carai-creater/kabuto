import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "",
});

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

const google = createGoogleGenerativeAI({
  // Vercel などでは GEMINI_API_KEY という名前で置くことが多い
  apiKey:
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
    process.env.GEMINI_API_KEY ??
    "",
});

/**
 * UI / DB の modelId に応じて OpenAI / Anthropic / Google のプロバイダーを切り替える。
 */
export function getLanguageModel(modelId: string) {
  if (modelId.startsWith("gpt-") || modelId.startsWith("o1") || modelId.startsWith("o3") || modelId.startsWith("o4")) {
    return openai(modelId);
  }
  if (modelId.startsWith("claude")) {
    return anthropic(modelId);
  }
  return google(modelId);
}

export const embeddingModel = openai.embedding("text-embedding-3-small");
