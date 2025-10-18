import { getConfig } from "@/lib/config";

import type {
  EstimateCostParams,
  GenerateImageParams,
  GenerateImageResult,
  GenerateTextParams,
  GenerateTextResult,
  LLMProvider,
} from "./index";

interface OpenAIChatResponse {
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

interface OpenAIImageResponse {
  data: Array<{
    url: string;
    revised_prompt?: string;
  }>;
}

const DEFAULT_TEXT_MODEL = "gpt-4o-mini";
const DEFAULT_IMAGE_MODEL = "gpt-image-1";
const TOKEN_COSTS: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "gpt-4.1": { input: 0.0005, output: 0.0015 },
};

export class OpenAIProvider implements LLMProvider {
  id = "openai" as const;
  label = "OpenAI";
  supportsImages = true;

  private get apiKey() {
    return getConfig().OPENAI_API_KEY;
  }

  private ensureCredentials() {
    if (!this.apiKey) {
      throw new Error("OpenAI API key not configured. Defina OPENAI_API_KEY.");
    }
  }

  async generateText(params: GenerateTextParams): Promise<GenerateTextResult> {
    this.ensureCredentials();
    const model = params.model || DEFAULT_TEXT_MODEL;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          params.system
            ? {
                role: "system",
                content: params.system,
              }
            : null,
          {
            role: "user",
            content: params.prompt,
          },
        ].filter(Boolean),
        temperature: params.temperature ?? 0.8,
        max_tokens: params.maxTokens ?? 2048,
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.text();
      throw new Error(`OpenAI text generation failed: ${errorPayload}`);
    }

    const json = (await response.json()) as OpenAIChatResponse;
    const message = json.choices[0]?.message?.content;

    if (!message) {
      throw new Error("OpenAI returned empty response");
    }

    const tokensIn = json.usage?.prompt_tokens;
    const tokensaout = json.usage?.completion_tokens;

    const cost = await this.estimateCost({
      model,
      promptTokens: tokensIn ?? 0,
      completionTokens: tokensaout ?? 0,
    }).catch(() => undefined);

    return {
      content: message,
      tokensIn,
      tokensaout,
      costInCredits: cost,
      raw: json,
    };
  }

  async generateImage(params: GenerateImageParams): Promise<GenerateImageResult> {
    this.ensureCredentials();
    const model = params.model ?? DEFAULT_IMAGE_MODEL;

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: params.prompt,
        size: params.size ?? "1024x1024",
        response_format: "url",
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.text();
      throw new Error(`OpenAI image generation failed: ${errorPayload}`);
    }

    const json = (await response.json()) as OpenAIImageResponse;
    const first = json.data[0];
    if (!first?.url) {
      throw new Error("OpenAI did not return image url");
    }

    return {
      url: first.url,
      revisedPrompt: first.revised_prompt,
      costInCredits: 5,
    };
  }

  async estimateCost({ model, promptTokens, completionTokens }: EstimateCostParams): Promise<number> {
    const costMap = TOKEN_COSTS[model] ?? TOKEN_COSTS[DEFAULT_TEXT_MODEL];
    const inputCost = (promptTokens / 1000) * costMap.input;
    const outputCost = (completionTokens / 1000) * costMap.output;

    // Convert USD tokens cost to internal credits (1 credit ~= $0.01)
    const usd = inputCost + outputCost;
    return Math.max(1, Math.round((usd / 0.01) * 100) / 100);
  }
}
