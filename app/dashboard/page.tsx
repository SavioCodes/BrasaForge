import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUserServer } from "@/lib/auth";
import { getCredits } from "@/lib/guard/credits";
import { formatCurrencyBRL } from "@/lib/utils";
import { getSupabaseServiceRoleClient } from "@/lib/supabase";

export default async function DashboardHomePage() {
  const user = await getUserServer();
  if (!user) {
    return null;
  }

  const supabase = getSupabaseServiceRoleClient();
  const credits = await getCredits(user.id);

  const [{ data: jobs }, { data: sites }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, kind, status, created_at, estimated_credits, site_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("sites").select("id, title, status").eq("user_id", user.id).limit(5),
  ]);

  return (
    <div className="space-y-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Ola, {user.user_metadata?.full_name ?? "criador(a)"}</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe seus creditos, jobs recentes e continue construindo sites com IA.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/dashboard/generate">Gerar novo site</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/sites">Ver sites</Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-3xl border-border/40 shadow-lg">
          <CardHeader>
            <CardTitle>Creditos disponiveis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-bold text-brasa-purple">{credits.available}</p>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Plano atual: {credits.plan ?? "Trial"}</p>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/billing">Gerenciar plano</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-border/40 shadow-lg">
          <CardHeader>
            <CardTitle>Sites recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sites?.length ? (
              sites.map((site) => (
                <Link
                  key={site.id}
                  href={`/dashboard/sites/${site.id}`}
                  className="flex items-center justify-between rounded-2xl border border-border/20 px-3 py-2 text-sm text-muted-foreground transition hover:border-border hover:text-foreground"
                >
                  <span>{site.title}</span>
                  <Badge variant="secondary">{site.status}</Badge>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum site gerado ainda.</p>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-border/40 shadow-lg">
          <CardHeader>
            <CardTitle>Ultimos gastos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Creditos totais: {credits.total}</p>
            <p>Creditos utilizados: {credits.used}</p>
            <p>Valor estimado: {formatCurrencyBRL(credits.used * 0.01)}</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">Jobs recentes</h2>
        <div className="overflow-hidden rounded-3xl border border-border/20">
          <table className="min-w-full divide-y divide-border/30 text-sm">
            <thead className="bg-muted/20 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest">Job</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest">Status</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest">Creditos</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {jobs?.map((job) => (
                <tr key={job.id} className="hover:bg-muted/10">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{job.kind}</span>
                      <span className="text-xs text-muted-foreground">{job.id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={job.status === "failed" ? "destructive" : "secondary"}>{job.status}</Badge>
                  </td>
                  <td className="px-4 py-3">{job.estimated_credits ?? "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(job.created_at).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
              {!jobs?.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    Nenhum job ainda. Que tal gerar seu primeiro site?
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

