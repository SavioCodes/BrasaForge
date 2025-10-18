import { NextResponse } from "next/server";
import { z } from "zod";

import { getUserServer } from "@/lib/auth";
import { getJob } from "@/lib/queue/worker";
import { getSupabaseServiceRoleClient } from "@/lib/supabase";

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getUserServer();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = ParamsSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
  }

  const supabase = getSupabaseServiceRoleClient();

  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, status, result, error, site_id, kind, cost_credits, provider_id, model, created_at, updated_at")
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!job) {
    return NextResponse.json({ error: "Job nao encontrado" }, { status: 404 });
  }

  const queueState = await getJob(job.id).catch(() => null);

  return NextResponse.json({
    job,
    queue: queueState
      ? {
          status: queueState.status,
          attempts: queueState.attempts,
          lastError: queueState.lastError,
        }
      : null,
  });
}
