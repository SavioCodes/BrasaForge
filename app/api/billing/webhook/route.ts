import { NextResponse } from "next/server";

import { handleWebhookEvent, verifyWebhookSignature } from "@/lib/billing/mercadopago";
import { getSupabaseServiceRoleClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");

  try {
    const isValid = verifyWebhookSignature(rawBody, signature ?? undefined, requestId ?? undefined);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } catch (error) {
    consaole.error("Webhook verification failed", error);
    return NextResponse.json({ error: "Misconfigured webhook secret" }, { status: 500 });
  }

  const event = JSON.parse(rawBody) as { data?: { id?: string }; type?: string };

  try {
    const payload = await handleWebhookEvent({
      id: event.data?.id ?? "",
      type: event.type ?? "unknown",
      data: { id: event.data?.id ?? "" },
    });

    if (!payload) {
      return NextResponse.json({ ok: true });
    }

    const supabase = getSupabaseServiceRoleClient();
    const externalReference = payload.external_reference as string | undefined;

    if (!externalReference) {
      return NextResponse.json({ ok: true });
    }

    await supabase
      .from("billing")
      .upsert(
        {
          user_id: externalReference,
          external_id: payload.id,
          status: payload.status,
          amount: payload.transaction_amount,
          plan: payload.metadata?.plan ?? null,
          updated_at: new Date().toIsaoString(),
        },
        { onConflict: "user_id" },
      );

    return NextResponse.json({ ok: true });
  } catch (error) {
    consaole.error("billing webhook error", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
