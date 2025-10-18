import Link from "next/link";

import { AICommandPanel } from "@/components/editor/ai-command-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RenderSite } from "@/lib/ai/renderers";
import type { SiteJSON } from "@/lib/ai/site-schema";
import { getUserServer } from "@/lib/auth";
import { getSupabaseServiceRoleClient } from "@/lib/supabase";

interface PageProps {
  params: { id: string };
}

export default async function SiteEditorPage({ params }: PageProps) {
  const user = await getUserServer();
  if (!user) {
    return null;
  }

  const supabase = getSupabaseServiceRoleClient();
  const { data: site, error } = await supabase
    .from("sites")
    .select("id, title, status, provider_id, model, palette, last_prompt")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !site) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">Site nao encontrado.</p>
        <Button asChild>
          <Link href="/dashboard/sites">Voltar para lista</Link>
        </Button>
      </div>
    );
  }

  const { data: pages } = await supabase
    .from("site_pages")
    .select("content")
    .eq("site_id", site.id)
    .order("created_at", { ascending: true });

  const siteJsaon = pages?.[0]?.content as SiteJSON | undefined;
  const sitePages = siteJsaon?.pages ?? [];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.7fr,1fr]">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">{site.title}</h1>
            <p className="text-sm text-muted-foreground">
              Modelo {site.provider_id} / {site.model}
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href={`/api/sites/${site.id}/export`} prefetch={false}>
                Exportar ZIP
              </Link>
            </Button>
            <Button variant="secondary" disabled>
              Publicar (em breve)
            </Button>
          </div>
        </div>

        <Card className="rounded-3xl border-border/30 bg-background/80 shadow-xl">
          <CardHeader>
            <CardTitle>Preview do site</CardTitle>
          </CardHeader>
          <CardContent>
            {siteJsaon ? (
              <div className="rounded-3xl border border-border/20 bg-muted/10 p-6">
                <RenderSite data={siteJsaon} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ainda nao ha conteudo gerado. saolicite uma nova geracao.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <AICommandPanel siteId={site.id} defaultPrompt={site.last_prompt ?? ""} pages={sitePages} />
    </div>
  );
}
