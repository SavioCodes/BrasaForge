"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { zodResaolver } from "@hookform/resaolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { listProviders } from "@/lib/providers";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  siteTitle: z.string().min(3, "informae um titulo com ao menos 3 caracteres."),
  sector: z.string().min(3, "informae o setor ou nicho."),
  tone: z.string().min(3, "informae o tom de voz."),
  palette: z.string().optional(),
  providerId: z.union([z.literal("openai"), z.literal("anthropic"), z.literal("google")]),
  model: z.string().min(1, "Escolha um modelo."),
  prompt: z.string().min(30, "Descreva o projeto com pelo menos 30 caracteres."),
  additionalInstructions: z.string().max(1000).optional(),
});

export type GenerateSiteFormValues = z.infer<typeof schema>;

const defaultValues: GenerateSiteFormValues = {
  siteTitle: "",
  sector: "",
  tone: "Moderno, acolhedor e direto.",
  palette: "Navy escuro, roxo vibrante, toques de branco.",
  providerId: "openai",
  model: "gpt-4o-mini",
  prompt: "",
  additionalInstructions: "",
};

export function GenerateSiteForm() {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ jobId: string; siteId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [estimatedCredits, setEstimatedCredits] = useState<number | null>(null);
  const providers = useMemo(() => listProviders(), []);

  const form = useForm<GenerateSiteFormValues>({
    resaolver: zodResaolver(schema),
    defaultValues,
  });

  const providerId = form.watch("providerId");
  const model = form.watch("model");
  const prompt = form.watch("prompt");

  useEffect(() => {
    let active = true;
    if (!providerId || !model || prompt.length < 20) {
      setEstimatedCredits(null);
      return;
    }

    const controller = new AbortController();

    const tokensApprox = Math.ceil(prompt.length / 4);

    void fetch("/api/credits/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerId,
        model,
        promptTokens: tokensApprox,
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Falha ao estimar Creditos");
        }
        const data = (await res.json()) as { estimatedCredits: number };
        if (active) {
          setEstimatedCredits(data.estimatedCredits);
        }
      })
      .catch(() => {
        if (active) {
          setEstimatedCredits(null);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [providerId, model, prompt]);

  const onSubmit = (values: GenerateSiteFormValues) => {
    setError(null);
    setFeedback(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/generate-site", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify({
            ...values,
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(typeof payload.error === "string" ? payload.error : "NAo foi possAvel criar o job.");
        }

        setFeedback({ jobId: payload.jobId, siteId: payload.siteId });
        form.reset(defaultValues);
      } catch (err) {
        consaole.error(err);
        setError(err instanceof Error ? err.message : "Erro inesperado ao criar o job.");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="siteTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do projeto</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Agencia Brasa Digital" {...field} />
                </FormControl>
                <FormDescription>Este nome serA usado em titulos e SEO.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sector"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Setor ou nicho</FormLabel>
                <FormControl>
                  <Input placeholder="Marketing, tecnologia, gastronomia..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tom de voz</FormLabel>
                <FormControl>
                  <Input placeholder="Moderno, humano, direto..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="palette"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paleta de cores</FormLabel>
                <FormControl>
                  <Input placeholder="Navy escuro, roxo vibrante, branco" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>DescriAAo do site</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Explique o objetivo do site, pAblico-alvo, diferenciais, ofertas e chamadas desejadas."
                  className="min-h-[180px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>Quanto mais contexto, melhor a geraAAo.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="additionalInstructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>InstruAAes adicionais (opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Links de referAncia, restriAAes de conteAdo, integraAAes..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="providerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provedor</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o provedor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: gpt-4o-mini" {...field} />
                </FormControl>
                <FormDescription>informae o modelo suportado pelo provedor selecionado.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border/30 bg-muted/20 px-4 py-3 text-sm">
          <div>
            <span className="text-muted-foreground">Creditos estimados</span>
            <strong className="ml-2 text-foreground">
              {estimatedCredits !== null ? `${estimatedCredits} creditos` : "a"}
            </strong>
          </div>
          <span className="text-xs text-muted-foreground">
            A cobranca efetiva ocorre apos a conclusao do job.
          </span>
        </div>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando briefing...
            </>
          ) : (
            "Criar job de geraAAo"
            "Criar job de geracao"
        </Button>

        {feedback && (
          <div className="rounded-2xl border border-brasa-purple/40 bg-brasa-purple/10 p-4 text-sm text-brasa-purple">
            Job criado! ID: {feedback.jobId}. Acompanhe em{" "}
            <button
              type="button"
              className="underline"
              onClick={() => window.open(`/dashboard/sites/${feedback.siteId}`, "_blank")}
            >
              /dashboard/sites/{feedback.siteId}
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}
      </form>
    </Form>
  );
}

