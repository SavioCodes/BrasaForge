import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { getUserServer } from "@/lib/auth";
import { logApiCall } from "@/lib/api/log";
import { getCredits } from "@/lib/guard/credits";
import { RateLimitError, assertRateLimit } from "@/lib/guard/ratelimit";
import { getProvider } from "@/lib/providers";
import type { GenerateSiteJob } from "@/lib/queue/jobs";
import { enqueueJob } from "@/lib/queue/worker";
import { redis } from "@/lib/redis";
import { getSupabaseServiceRoleClient } from "@/lib/supabase";

const BodySchema = z.object({
  siteTitle: z.string().min(3).max(80),
  prompt: z.string().min(20).max(4000),
  providerId: z.union([z.literal("openai"), z.literal("anthropic"), z.literal("google")]),
  model: z.string().min(1),
  tone: z.string().default("moderno e humano"),
  palette: z.string().optional(),
  sector: z.string().optional(),
  siteId: z.string().uuid().optional(),
  additionalInstructions: z.string().max(1000).optional(),
});

const IDEMPOTENCY_PREFIX = "idem:generate-site:";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const supabase = getSupabaseServiceRoleClient();

  try {
    const user = await getUserServer();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await assertRateLimit({
      key: `generate-site:${user.id}`,
      limit: 10,
      windowSeconds: 60,
    });

    const idempotencyKey = request.headers.get("Idempotency-Key");
    if (idempotencyKey) {
      const cached = await redis.get(IDEMPOTENCY_PREFIX + idempotencyKey);
      if (cached) {
        const parsed = JSON.parse(cached) as { status: number; body: unknown };
        return NextResponse.json(parsed.body, { status: parsed.status });
      }
    }

    const json = await request.json();
    const body = BodySchema.parse(json);

    const provider = getProvider(body.providerId);
    const estimatedCredits = await provider
      .estimateCost?.({
        model: body.model,
        promptTokens: Math.ceil(body.prompt.length / 4),
        completionTokens: 1024,
      })
      .catch(() => 10);

    const credits = await getCredits(user.id);
    if (credits.available < (estimatedCredits ?? 10)) {
      return NextResponse.json(
        { error: "Voce nao possui creditos suficientes. Ajuste o plano ou adquira mais creditos." },
        { status: 402 },
      );
    }

    const siteId = body.siteId ?? randomUUID();
    if (!body.siteId) {
      await supabase.from("sites").insert({
        id: siteId,
        user_id: user.id,
        title: body.siteTitle,
        status: "draft",
        provider_id: body.providerId,
        model: body.model,
        palette: body.palette,
        sector: body.sector,
        last_prompt: body.prompt,
      });
    } else {
      await supabase
        .from("sites")
        .update({
          title: body.siteTitle,
          provider_id: body.providerId,
          model: body.model,
          palette: body.palette,
          sector: body.sector,
          last_prompt: body.prompt,
        })
        .eq("id", siteId)
        .eq("user_id", user.id);
    }

    const jobId = randomUUID();

    await supabase.from("jobs").insert({
      id: jobId,
      user_id: user.id,
      site_id: siteId,
      kind: "generate_site",
      status: "queued",
      provider_id: body.providerId,
      model: body.model,
      prompt: body.prompt,
      estimated_credits: estimatedCredits,
    });

    const payload: GenerateSiteJob = {
      kind: "generate_site",
      userId: user.id,
      providerId: body.providerId,
      model: body.model,
      prompt: JSON.stringify({
        title: body.siteTitle,
        prompt: body.prompt,
        tone: body.tone,
        palette: body.palette,
        sector: body.sector,
        additionalInstructions: body.additionalInstructions,
      }),
      siteId,
    };

    await enqueueJob(payload, { id: jobId });

    const responsePayload = {
      jobId,
      siteId,
      status: "queued" as const,
      estimatedCredits,
    };

    if (idempotencyKey) {
      await redis.set(
        IDEMPOTENCY_PREFIX + idempotencyKey,
        JSON.stringify({ status: 202, body: responsePayload }),
        60,
      );
    }

    await logApiCall({
      route: "/api/generate-site",
      userId: user.id,
      status: 202,
      durationMs: Date.now() - startedAt,
      providerId: body.providerId,
      model: body.model,
      costInCredits: estimatedCredits,
    });

    return NextResponse.json(responsePayload, { status: 202 });
  } catch (error) {
    console.error("generate-site error", error);

    const status = error instanceof RateLimitError ? 429 : 500;
    const message =
      error instanceof z.ZodError
        ? error.flatten()
        : error instanceof RateLimitError
          ? error.message
          : "Erro ao criar job de site";

    await logApiCall({
      route: "/api/generate-site",
      status,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: message }, { status });
  }
}
