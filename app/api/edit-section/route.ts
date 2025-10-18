import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { getUserServer } from "@/lib/auth";
import { logApiCall } from "@/lib/api/log";
import { getCredits } from "@/lib/guard/credits";
import { RateLimitError, assertRateLimit } from "@/lib/guard/ratelimit";
import { getProvider } from "@/lib/providers";
import type { EditSectionJob } from "@/lib/queue/jobs";
import { enqueueJob } from "@/lib/queue/worker";
import { getSupabaseServiceRoleClient } from "@/lib/supabase";

const BodySchema = z.object({
  siteId: z.string().uuid(),
  pageRoute: z.string().min(1),
  sectionId: z.string().min(1),
  instruction: z.string().min(10).max(2000),
  providerId: z.union([z.literal("openai"), z.literal("anthropic"), z.literal("google")]),
  model: z.string().min(1),
});

export async function POST(request: Request) {
  const startedAt = Date.now();
  const supabase = getSupabaseServiceRoleClient();

  try {
    const user = await getUserServer();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await assertRateLimit({
      key: `edit-section:${user.id}`,
      limit: 20,
      windowSeconds: 60,
    });

    const json = await request.json();
    const body = BodySchema.parse(json);

    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("id, user_id")
      .eq("id", body.siteId)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: "Site nao encontrado" }, { status: 404 });
    }

    if (site.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const provider = getProvider(body.providerId);
    const estimatedCredits = await provider
      .estimateCost?.({
        model: body.model,
        promptTokens: Math.ceil(body.instruction.length / 4),
        completionTokens: 400,
      })
      .catch(() => 5);

    const credits = await getCredits(user.id);
    if (credits.available < (estimatedCredits ?? 5)) {
      return NextResponse.json({ error: "Creditos insuficientes" }, { status: 402 });
    }

    const jobId = randomUUID();

    await supabase.from("jobs").insert({
      id: jobId,
      user_id: user.id,
      site_id: body.siteId,
      kind: "edit_section",
      status: "queued",
      provider_id: body.providerId,
      model: body.model,
      prompt: body.instruction,
      estimated_credits: estimatedCredits,
      metadata: { pageRoute: body.pageRoute, sectionId: body.sectionId },
    });

    const payload: EditSectionJob = {
      kind: "edit_section",
      userId: user.id,
      providerId: body.providerId,
      model: body.model,
      siteId: body.siteId,
      pageRoute: body.pageRoute,
      sectionId: body.sectionId,
      instruction: body.instruction,
    };

    await enqueueJob(payload, { id: jobId });

    await logApiCall({
      route: "/api/edit-section",
      userId: user.id,
      status: 202,
      durationMs: Date.now() - startedAt,
      providerId: body.providerId,
      model: body.model,
      costInCredits: estimatedCredits,
    });

    return NextResponse.json({ jobId, status: "queued", estimatedCredits }, { status: 202 });
  } catch (error) {
    console.error("edit-section error", error);
    const status = error instanceof RateLimitError ? 429 : 500;
    const message =
      error instanceof z.ZodError
        ? error.flatten()
        : error instanceof RateLimitError
          ? error.message
          : "Erro ao criar job de edicao";

    await logApiCall({
      route: "/api/edit-section",
      status,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: message }, { status });
  }
}
