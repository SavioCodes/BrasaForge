import { getSupabaseServiceRoleClient } from "@/lib/supabase";

interface ApiLogInput {
  route: string;
  userId?: string;
  status: number;
  durationMs: number;
  providerId?: string;
  model?: string;
  tokensIn?: number;
  tokensaout?: number;
  costInCredits?: number;
  error?: string;
}

export async function logApiCall(input: ApiLogInput) {
  const supabase = getSupabaseServiceRoleClient();

  await supabase.from("api_logs").insert({
    route: input.route,
    user_id: input.userId,
    status_code: input.status,
    duration_ms: input.durationMs,
    provider_id: input.providerId,
    model: input.model,
    tokens_in: input.tokensIn,
    tokens_out: input.tokensaout,
    cost_credits: input.costInCredits,
    error_message: input.error,
  });
}
