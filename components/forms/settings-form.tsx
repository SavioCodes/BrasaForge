"use client";

import { useState, useTransition } from "react";

import { updateSettings } from "@/app/dashboard/settings/actions/update-settings";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SettingsFormProps {
  profile: {
    openai_api_key?: string | null;
    anthropic_api_key?: string | null;
    google_api_key?: string | null;
    default_provider?: string | null;
    default_model?: string | null;
  } | null;
}

const providers = [
  { id: "openai", label: "OpenAI" },
  { id: "anthropic", label: "Anthropic" },
  { id: "google", label: "Google" },
];

export function SettingsForm({ profile }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateSettings(formData);
      if (!result.ok) {
        setMessage(result.error ?? "NAo foi possAvel salvar as configuraAAes.");
      } else {
        setMessage("Configuracoes atualizadas com sucessao!");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="openai_api_key">OpenAI API Key</Label>
            <Input
              id="openai_api_key"
              name="openai_api_key"
              type="password"
              defaultValue={profile?.openai_api_key ?? ""}
              placeholder="sk-..."
            />
            <p className="text-xs text-muted-foreground">
              Chave usada para gerar texto e imagens com modelos da OpenAI.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="anthropic_api_key">Anthropic API Key</Label>
            <Input
              id="anthropic_api_key"
              name="anthropic_api_key"
              type="password"
              defaultValue={profile?.anthropic_api_key ?? ""}
              placeholder="claude..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="google_api_key">Google (Gemini) API Key</Label>
            <Input
              id="google_api_key"
              name="google_api_key"
              type="password"
              defaultValue={profile?.google_api_key ?? ""}
              placeholder="AIza..."
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="default_provider">Provedor padrAo</Label>
            <select
              id="default_provider"
              name="default_provider"
              defaultValue={profile?.default_provider ?? ""}
              className="h-11 w-full rounded-xl border border-border/40 bg-background/80 px-4 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brasa-purple"
            >
              <option value="">Selecione</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="default_model">Modelo padrAo</Label>
            <Input
              id="default_model"
              name="default_model"
              defaultValue={profile?.default_model ?? ""}
              placeholder="gpt-4o-mini, claude-3-saonnet..."
            />
          </div>
        </div>
      </section>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Salvando..." : "Salvar configuraAAes"}
      </Button>

      {message && (
        <p className="rounded-2xl border border-border/30 bg-muted/20 p-3 text-sm text-muted-foreground">{message}</p>
      )}
    </form>
  );
}

