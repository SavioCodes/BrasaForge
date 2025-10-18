import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserServer } from "@/lib/auth";
import { getSupabaseServiceRoleClient } from "@/lib/supabase";

export default async function SitesPage() {
  const user = await getUserServer();
  if (!user) {
    return null;
  }

  const supabase = getSupabaseServiceRoleClient();
  const { data: sites } = await supabase
    .from("sites")
    .select("id, title, status, provider_id, model, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-10">
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold">Seus sites</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe status, edite seAAes com IA ou exporte o cAdigo pronto.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/generate">Gerar novo site</Link>
        </Button>
      </header>

      <Card className="rounded-3xl border-border/30 bg-background/80 shadow-lg">
        <CardHeader>
          <CardTitle>Projetos gerados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {sites?.length ? (
              sites.map((site) => (
                <div
                  key={site.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border/30 p-4 transition hover:border-border hover:bg-muted/10 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{site.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {site.provider_id} a {site.model} a Atualizado em{" "}
                      {new Date(site.updated_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="secondary">{site.status}</Badge>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/sites/${site.id}`}>Abrir editor</Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum site gerado ainda. Clique em aGerar novo sitea para comeAar.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

