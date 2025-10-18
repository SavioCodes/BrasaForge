import { NextResponse } from "next/server";
import { z } from "zod";

import { getUserServer } from "@/lib/auth";
import { logApiCall } from "@/lib/api/log";
import { spendCredits } from "@/lib/guard/credits";
import { RateLimitError, assertRateLimit } from "@/lib/guard/ratelimit";
import { getProvider } from "@/lib/providers";
import { getSupabaseServiceRoleClient } from "@/lib/supabase";

const BodySchema = z.object({
  siteId: z.string().uuid().optional(),
  prompt: z.string().min(10).max(2000),
  size: z.union([z.literal("256x256"), z.literal("512x512"), z.literal("1024x1024")]).default("1024x1024"),
  providerId: z.union([z.literal("openai"), z.literal("google")]).default("openai"),
  model: z.string().optional(),
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
      key: `generate-image:${user.id}`,
      limit: 10,
      windowSeconds: 60,
    });

    const json = await request.json();
    const body = BodySchema.parse(json);

    const provider = getProvider(body.providerId);
    if (!provider.supportsImages || !provider.generateImage) {
      return NextResponse.json(
        { error: "Este provedor nao suporta geracao de imagens. Escolha OpenAI ou Google." },
        { status: 400 },
      );
    }

    const generation = await provider.generateImage({
      prompt: body.prompt,
      size: body.size,
      model: body.model,
    });

    const response = await fetch(generation.url);
    if (!response.ok) {
      throw new Error("Falha ao obter imagem do provedor");
    }

    const buffer = await response.arrayBuffer();
    const filename = `${user.id}/${body.siteId ?? "standalone"}/${Date.now()}.png`;

    const { error: uploadError, data } = await supabase.storage
      .from("site-assets")
      .upload(filename, buffer, {
        contentType: response.headers.get("content-type") ?? "image/png",
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const publicUrl = supabase.storage.from("site-assets").getPublicUrl(data.path).data?.publicUrl;

    const amount = generation.costInCredits ?? 5;
    await spendCredits(user.id, {
      amount,
      reason: "generate_image",
      referenceId: filename,
    });

    await logApiCall({
      route: "/api/generate-image",
      userId: user.id,
      status: 200,
      durationMs: Date.now() - startedAt,
      providerId: provider.id,
      model: body.model,
      costInCredits: amount,
    });

    return NextResponse.json({ url: publicUrl, size: body.size }, { status: 200 });
  } catch (error) {
    console.error("generate-image error", error);
    const status = error instanceof RateLimitError ? 429 : 500;
    const message =
      error instanceof z.ZodError
        ? error.flatten()
        : error instanceof RateLimitError
          ? error.message
          : "Erro ao gerar imagem";

    await logApiCall({
      route: "/api/generate-image",
      status,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: message }, { status });
  }
}
