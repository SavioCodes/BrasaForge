import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/components/forms/settings-form";
import { requireUser } from "@/lib/auth";
import { getSupabaseServiceRoleClient } from "@/lib/supabase";

export default async function SettingsPage() {
  const user = await requireUser("/login");
  const supabase = getSupabaseServiceRoleClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("openai_api_key, anthropic_api_key, google_api_key, default_provider, default_model")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold">Configuracoes</h1>
        <p className="text-sm text-muted-foreground">
          Defina provedores padrao e conecte chaves de API privadas. Elas sao armazenadas com criptografia.
        </p>
      </header>
      <Card className="rounded-3xl border-border/30 bg-background/80 shadow-lg">
        <CardHeader>
          <CardTitle>Provedores de IA</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm profile={profile ?? null} />
        </CardContent>
      </Card>
    </div>
  );
}

