import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GenerateSiteForm } from "@/components/forms/generate-site-form";

export const dynamic = "force-dynamic";

export default function GenerateSitePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header>
        <h1 className="font-display text-3xl font-bold">Gerar novo site</h1>
        <p className="text-sm text-muted-foreground">
          Descreva o projeto e deixe a Brasa Forge gerar estrutura, copy e Supabase para vocA.
        </p>
      </header>

      <Card className="rounded-3xl border-border/30 bg-background/70 shadow-xl">
        <CardHeader>
          <CardTitle>Briefing do projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <GenerateSiteForm />
        </CardContent>
      </Card>
    </div>
  );
}

