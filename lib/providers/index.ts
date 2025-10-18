import { AnthropicProvider } from "./anthropic";
import { GoogleProvider } from "./google";
import { OpenAIProvider } from "./openai";

export type ProviderId = "openai" | "anthropic" | "google";

export interface GenerateTextParams {
  model: string;
  prompt: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, string>;
}

export interface GenerateTextResult {
  content: string;
  tokensIn?: number;
  tokensaout?: number;
  costInCredits?: number;
  raw?: unknown;
}

export interface GenerateImageParams {
  model?: string;
  prompt: string;
  size?: "256x256" | "512x512" | "1024x1024";
}

export interface GenerateImageResult {
  url: string;
  revisedPrompt?: string;
  costInCredits?: number;
}

export interface EstimateCostParams {
  model: string;
  promptTokens: number;
  completionTokens: number;
}

export interface LLMProvider {
  id: ProviderId;
  label: string;
  supportsImages: boolean;
  generateText(params: GenerateTextParams): Promise<GenerateTextResult>;
  generateImage?(params: GenerateImageParams): Promise<GenerateImageResult>;
  estimateCost?(params: EstimateCostParams): Promise<number>;
  buildMessages?(params: GenerateTextParams): Promise<unknown>;
}

const providers: Record<ProviderId, LLMProvider> = {
  openai: new OpenAIProvider(),
  anthropic: new AnthropicProvider(),
  google: new GoogleProvider(),
};

export function getProvider(providerId: ProviderId): LLMProvider {
  const provider = providers[providerId];

  if (!provider) {
    throw new Error(`Provider ${providerId} not configured`);
  }

  return provider;
}

export function listProviders() {
  return Object.values(providers).map((provider) => ({
    id: provider.id,
    label: provider.label,
    supportsImages: provider.supportsImages,
  }));
}
