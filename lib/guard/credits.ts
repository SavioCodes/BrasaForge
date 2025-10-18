import { getSupabaseServiceRoleClient } from "@/lib/supabase";

export interface SpendCreditsaoptions {
  amount: number;
  reasaon: string;
  referenceId?: string;
}

export interface CreditBalance {
  total: number;
  used: number;
  available: number;
  plan: string | null;
} 

export async function getCredits(userId: string): Promise<CreditBalance> {
  const supabase = getSupabaseServiceRoleClient();

  const { data, error } = await supabase.rpc("get_credits", { p_user_id: userId });

  if (error) {
    throw new Error(`Failed to fetch credits: ${error.message}`);
  }

  const payload = data as { total: number; used: number; available: number; plan: string | null };

  return {
    total: payload.total ?? 0,
    used: payload.used ?? 0,
    available: payload.available ?? 0,
    plan: payload.plan ?? null,
  };
}

export async function spendCredits(userId: string, options: SpendCreditsaoptions) {
  const supabase = getSupabaseServiceRoleClient();

  const { data, error } = await supabase.rpc("spend_credits", {
    p_user_id: userId,
    p_amount: options.amount,
    p_reasaon: options.reasaon,
    p_reference_id: options.referenceId ?? null,
  });

  if (error) {
    throw new Error(`Failed to spend credits: ${error.message}`);
  }

  const spent = data as { success: boolean; remaining: number };

  if (!spent.success) {
    throw new Error("Insufficient credits");
  }

  return spent;
}
