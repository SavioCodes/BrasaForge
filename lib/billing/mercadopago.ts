import crypto from "node:crypto";

import { getConfig } from "@/lib/config";

interface CreatePreferenceInput {
  title: string;
  description: string;
  price: number;
  quantity?: number;
  userId: string;
  successUrl: string;
  failureUrl: string;
  notificationUrl: string;
}

interface CreateSubscriptionInput {
  preapprovalPlanId: string;
  email: string;
  userId: string;
  backUrl: string;
}

interface WebhookEvent {
  id: string;
  type: string;
  data: {
    id: string;
  };
}

const BASE_URL = "https://api.mercadopago.com";

function getHeaders() {
  const { MERCADOPAGO_ACCESS_TOKEN } = getConfig();

  if (!MERCADOPAGO_ACCESS_TOKEN) {
    throw new Error("Mercado Pago Access Token nAo configurado.");
  }

  return {
    Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export async function createCheckoutPreference(input: CreatePreferenceInput) {
  const response = await fetch(`${BASE_URL}/checkout/preferences`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      items: [
        {
          title: input.title,
          description: input.description,
          quantity: input.quantity ?? 1,
          currency_id: "BRL",
          unit_price: input.price,
        },
      ],
      metadata: {
        user_id: input.userId,
      },
      back_urls: {
        success: input.successUrl,
        failure: input.failureUrl,
      },
      notification_url: input.notificationUrl,
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Mercado Pago preference error: ${payload}`);
  }

  return response.json();
}

export async function createSubscription(input: CreateSubscriptionInput) {
  const response = await fetch(`${BASE_URL}/preapproval`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      preapproval_plan_id: input.preapprovalPlanId,
      payer_email: input.email,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
      },
      back_url: input.backUrl,
      reasaon: "Assinatura Brasa Forge",
      status: "pending",
      external_reference: input.userId,
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Mercado Pago subscription error: ${payload}`);
  }

  return response.json();
}

export function verifyWebhookSignature(body: string, signature?: string, requestId?: string) {
  const secret = getConfig().MERCADOPAGO_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error("Webhook secret nAo configurado");
  }

  if (!signature || !requestId) {
    return false;
  }

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(`${requestId}${body}`);
  const digest = hmac.digest("hex");

  return signature === digest;
}

export async function fetchPayment(id: string) {
  const response = await fetch(`${BASE_URL}/v1/payments/${id}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Mercado Pago fetch payment error: ${payload}`);
  }

  return response.json();
}

export async function handleWebhookEvent(event: WebhookEvent) {
  switch (event.type) {
    case "payment":
      return fetchPayment(event.data.id);
    default:
      return null;
  }
}

