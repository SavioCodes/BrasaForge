import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { createCheckoutPreference } from "@/lib/billing/mercadopago";
import { getConfig } from "@/lib/config";
import { getSupabaseServiceRoleClient } from "@/lib/supabase";
import { formatCurrencyBRL } from "@/lib/utils";

const plans = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfeito para freelancers e criadores solo.",
    price: 149,
    includes: ["20 projetos/mes", "3 exports incluidos", "Suporte por e-mail"],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Ideal para agencias que precisam de escala.",
    price: 349,
    includes: ["60 projetos/mes", "10 exports incluidos", "Colaboracao com ate 3 membros"],
  },
];

async function startCheckout(planId: string) {
  "use server";

  const user = await requireUser("/login");
  const plan = plans.find((item) => item.id === planId);
  if (!plan) {
    throw new Error("Plano invalido");
  }

  const config = getConfig();
  const preference = await createCheckoutPreference({
    title: `Brasa Forge ${plan.name}`,
    description: plan.description,
    price: plan.price,
    userId: user.id,
    quantity: 1,
    successUrl: `${config.NEXT_PUBLIC_APP_URL}/dashboard/billing?status=success`,
    failureUrl: `${config.NEXT_PUBLIC_APP_URL}/dashboard/billing?status=failure`,
    notificationUrl: `${config.NEXT_PUBLIC_APP_URL}/api/billing/webhook`,
  });

  redirect(preference.init_point ?? preference.back_urls?.success ?? "/dashboard/billing");
}

export default async function BillingPage() {
  const user = await requireUser("/login");
  const supabase = getSupabaseServiceRoleClient();
  const { data: billing } = await supabase
    .from("billing")
    .select("plan, status, amount, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold">Assinatura e creditos</h1>
        <p className="text-sm text-muted-foreground">Gerencie seu plano, pagamentos e limites de uso.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.id} className="rounded-3xl border-border/30 bg-background/80 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{plan.name}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {formatCurrencyBRL(plan.price)} / mes
                </span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <ul className="space-y-2">
                {plan.includes.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-brasa-purple" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <form action={startCheckout.bind(null, plan.id)}>
                <Button type="submit" className="w-full">
                  Assinar {plan.name}
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Historico recente</h2>
        <div className="overflow-hidden rounded-3xl border border-border/20">
          <table className="min-w-full divide-y divide-border/20 text-sm">
            <thead className="bg-muted/20 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest">Plano</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest">Status</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest">Valor</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {billing?.length ? (
                billing.map((row, index) => (
                  <tr key={`${row.updated_at}-${index}`} className="hover:bg-muted/10">
                    <td className="px-4 py-3">{row.plan ?? "Custom"}</td>
                    <td className="px-4 py-3 capitalize">{row.status ?? "pendente"}</td>
                    <td className="px-4 py-3">
                      {row.amount ? formatCurrencyBRL(row.amount) : formatCurrencyBRL(0)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(row.updated_at).toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    Nenhum pagamento registrado. Inicie uma assinatura para liberar recursos ilimitados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Precisa de plano enterprise?{" "}
          <Link href="mailto:contato@brasa.forge" className="text-brasa-purple underline">
            Fale com nosso time
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
