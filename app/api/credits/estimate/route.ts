import { NextResponse } from "next/server";
import { z } from "zod";

import { getProvider, listProviders } from "@/lib/providers";

const BodySchema = z
  .object({
    providerId: z.union([z.literal("openai"), z.literal("anthropic"), z.literal("google")]),
    model: z.string().min(1),
    promptTokens: z.number().min(1),
    completionTokens: z.number().min(1),
  })
  .partial({ completionTokens: true });

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = BodySchema.parse(json);

    const provider = getProvider(body.providerId);
    const completionTokens = body.completionTokens ?? Math.round(body.promptTokens * 1.2);

    const estimatedCredits = await provider
      .estimateCost?.({
        model: body.model,
        promptTokens: body.promptTokens,
        completionTokens,
      })
      .catch(() => 10);

    return NextResponse.json(
      {
        estimatedCredits: estimatedCredits ?? 10,
        providers: listProviders(),
      },
      { status: 200 },
    );
  } catch (error) {
    const status = error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json(
      {
        error:
          error instanceof z.ZodError ? error.flatten() : "Nao foi possivel calcular a estimativa de creditos.",
      },
      { status },
    );
  }
}
