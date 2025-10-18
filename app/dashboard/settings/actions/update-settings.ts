"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { getSupabaseServiceRoleClient } from "@/lib/supabase";

const settingsSchema = z.object({
  openai_api_key: z.string().optional(),
  anthropic_api_key: z.string().optional(),
  google_api_key: z.string().optional(),
  default_provider: z.union([z.literal("openai"), z.literal("anthropic"), z.literal("google")]).optional(),
  default_model: z.string().optional(),
});

export async function updateSettings(formData: FormData) {
  const user = await requireUser("/login");
  const supabase = getSupabaseServiceRoleClient();

  const parsed = settingsSchema.safeParse({
    openai_api_key: formData.get("openai_api_key")?.toString() || undefined,
    anthropic_api_key: formData.get("anthropic_api_key")?.toString() || undefined,
    google_api_key: formData.get("google_api_key")?.toString() || undefined,
    default_provider: formData.get("default_provider")?.toString() || undefined,
    default_model: formData.get("default_model")?.toString() || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: "Dados invalidos" };
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        openai_api_key: parsed.data.openai_api_key,
        anthropic_api_key: parsed.data.anthropic_api_key,
        google_api_key: parsed.data.google_api_key,
        default_provider: parsed.data.default_provider,
        default_model: parsed.data.default_model,
      },
      { onConflict: "id" },
    );

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { ok: true };
}

