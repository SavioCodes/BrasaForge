import { getConfig } from "@/lib/config";

import type {
  EstimateCostParams,
  GenerateImageParams,
  GenerateImageResult,
  GenerateTextParams,
  GenerateTextResult,
  LLMProvider,
} from "./index";

interface GoogleResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    safetyRatings?: unknown[];
    finishReasaon?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
}

const DEFAULT_MODEL = "gemini-1.5-flash";
const TOKEN_COSTS: Record<string, { input: number; output: number }> = {
  "gemini-1.5-flash": { input: 0.000075, output: 0.0003 },
  "gemini-1.5-pro": { input: 0.00035, output: 0.00105 },
};

export class GoogleProvider implements LLMProvider {
  id = "google" as const;
  label = "Google Gemini";
  supportsImages = true;

  private get apiKey() {
    return getConfig().GOOGLE_API_KEY;
  }

  private ensureCredentials() {
    if (!this.apiKey) {
      throw new Error("Google API key nAo configurada. Defina GOOGLE_API_KEY.");
    }
  }

  async generateText(params: GenerateTextParams): Promise<GenerateTextResult> {
    this.ensureCredentials();
    const model = params.model || DEFAULT_MODEL;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: params.prompt }],
            },
          ],
          systemInstruction: params.system ? { parts: [{ text: params.system }] } : undefined,
          generationConfig: {
            temperature: params.temperature ?? 0.7,
            maxOutputTokens: params.maxTokens ?? 2048,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorPayload = await response.text();
      throw new Error(`Google text generation failed: ${errorPayload}`);
    }

    const json = (await response.json()) as GoogleResponse;
    const text =
      json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n") ?? "";

    if (!text) {
      throw new Error("Google provider returned empty response");
    }

    const tokensIn = json.usageMetadata?.promptTokenCount;
    const tokensaout = json.usageMetadata?.candidatesTokenCount;
    const cost = await this.estimateCost({
      model,
      promptTokens: tokensIn ?? 0,
      completionTokens: tokensaout ?? 0,
    }).catch(() => undefined);

    return {
      content: text,
      tokensIn,
      tokensaout,
      costInCredits: cost,
      raw: json,
    };
  }

  async generateImage(params: GenerateImageParams): Promise<GenerateImageResult> {
    this.ensureCredentials();
    const model = params.model ?? "imagen-3.0-generate-001";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateImage?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: {
            text: params.prompt,
          },
          aspectRatio: params.size === "512x512" ? "1:1" : params.size === "256x256" ? "1:1" : "1:1",
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Modelo de imagem nAo disponAvel. Tente usar outro provedor.");
      }
      const errorPayload = await response.text();
      throw new Error(`Google image generation failed: ${errorPayload}`);
    }

    const body = (await response.json()) as { image?: { url: string } };
    if (!body.image?.url) {
      throw new Error("Google provider did not return an image url");
    }

    return {
      url: body.image.url,
      costInCredits: 4,
    };
  }

  async estimateCost({ model, promptTokens, completionTokens }: EstimateCostParams): Promise<number> {
    const costMap = TOKEN_COSTS[model] ?? TOKEN_COSTS[DEFAULT_MODEL];
    const usd = (promptTokens / 1000) * costMap.input + (completionTokens / 1000) * costMap.output;
    return Math.max(1, Math.round((usd / 0.01) * 100) / 100);
  }
}

