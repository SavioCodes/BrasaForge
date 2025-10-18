import { getConfig } from "@/lib/config";

import type {
  EstimateCostParams,
  GenerateTextParams,
  GenerateTextResult,
  LLMProvider,
} from "./index";

interface AnthropicResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

const DEFAULT_MODEL = "claude-3-saonnet-20240229";
const TOKEN_COSTS: Record<string, { input: number; output: number }> = {
  "claude-3-haiku-20240307": { input: 0.00025, output: 0.00125 },
  "claude-3-saonnet-20240229": { input: 0.003, output: 0.015 },
  "claude-3-opus-20240229": { input: 0.015, output: 0.075 },
};

export class AnthropicProvider implements LLMProvider {
  id = "anthropic" as const;
  label = "Anthropic Claude";
  supportsImages = false;

  private get apiKey() {
    return getConfig().ANTHROPIC_API_KEY;
  }

  private ensureCredentials() {
    if (!this.apiKey) {
      throw new Error("Anthropic API key not configured. Defina ANTHROPIC_API_KEY.");
    }
  }

  async generateText(params: GenerateTextParams): Promise<GenerateTextResult> {
    this.ensureCredentials();
    const model = params.model || DEFAULT_MODEL;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey!,
        "content-type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: params.maxTokens ?? 2048,
        temperature: params.temperature ?? 0.7,
        system: params.system,
        messages: [
          {
            role: "user",
            content: params.prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.text();
      throw new Error(`Anthropic text generation failed: ${errorPayload}`);
    }

    const json = (await response.json()) as AnthropicResponse;
    const contentBlock = json.content.find((block) => block.type === "text");

    if (!contentBlock?.text) {
      throw new Error("Anthropic returned empty response");
    }

    const tokensIn = json.usage?.input_tokens;
    const tokensaout = json.usage?.output_tokens;
    const cost = await this.estimateCost({
      model,
      promptTokens: tokensIn ?? 0,
      completionTokens: tokensaout ?? 0,
    }).catch(() => undefined);

    return {
      content: contentBlock.text,
      tokensIn,
      tokensaout,
      costInCredits: cost,
      raw: json,
    };
  }

  async estimateCost({ model, promptTokens, completionTokens }: EstimateCostParams): Promise<number> {
    const costMap = TOKEN_COSTS[model] ?? TOKEN_COSTS[DEFAULT_MODEL];
    const usd = (promptTokens / 1000) * costMap.input + (completionTokens / 1000) * costMap.output;
    return Math.max(1, Math.round((usd / 0.01) * 100) / 100);
  }

  async generateImage() {
    throw new Error("Anthropic nAo suporta geraAAo de imagens. Utilize outro provedor.");
  }
}

