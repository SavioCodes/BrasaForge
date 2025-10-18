"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";

import type { SitePage } from "@/lib/ai/site-schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface AICommandPanelProps {
  siteId: string;
  defaultPrompt: string;
  pages: SitePage[];
}

export function AICommandPanel({ siteId, defaultPrompt, pages }: AICommandPanelProps) {
  const [isEditing, startEditing] = useTransition();
  const [isGeneratingImage, startImage] = useTransition();
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [imageMessage, setImageMessage] = useState<string | null>(null);
  const [pageRoute, setPageRoute] = useState<string>(pages[0]?.route ?? "/");
  const [sectionId, setSectionId] = useState<string>(pages[0]?.sections[0]?.id ?? "");

  const sections = useMemo(() => {
    const current = pages.find((page) => page.route === pageRoute);
    return current?.sections ?? [];
  }, [pageRoute, pages]);

  const handlePageChange = (route: string) => {
    setPageRoute(route);
    const firstSection = pages.find((page) => page.route === route)?.sections[0]?.id;
    if (firstSection) {
      setSectionId(firstSection);
    }
  };

  const handleEditSubmit = (formData: FormData) => {
    startEditing(async () => {
      setEditMessage(null);
      const providerId = formData.get("providerId")?.toString() ?? "openai";
      const model = formData.get("model")?.toString() ?? "gpt-4o-mini";
      const instruction = formData.get("instruction")?.toString() ?? "";

      if (!sectionId) {
        setEditMessage("Selecione uma seAAo para editar.");
        return;
      }

      const response = await fetch("/api/edit-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          pageRoute,
          sectionId,
          instruction,
          providerId,
          model,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setEditMessage(typeof payload.error === "string" ? payload.error : "Erro ao solicitar ediAAo da seAAo.");
        return;
      }

      setEditMessage(`Job criado com sucessao! ID: ${payload.jobId}`);
    });
  };

  const handleImageSubmit = (formData: FormData) => {
    startImage(async () => {
      setImageMessage(null);
      const prompt = formData.get("imagePrompt")?.toString() ?? "";
      const size = formData.get("size")?.toString() ?? "1024x1024";
      const providerId = formData.get("imageProvider")?.toString() ?? "openai";

      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          prompt,
          size,
          providerId,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setImageMessage(typeof payload.error === "string" ? payload.error : "Erro ao gerar imagem.");
        return;
      }

      setImageMessage(`Imagem gerada! URL: ${payload.url}`);
    });
  };

  return (
    <aside className="sticky top-10 space-y-6 rounded-3xl border border-border/30 bg-background/80 p-6 shadow-xl">
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold">Comandos IA</h2>
        <p className="text-sm text-muted-foreground">
          Gere novas seAAes, ajuste textos especAficos ou crie imagens alinhadas com o site.
        </p>
      </div>

      <Tabs defaultValue="edit">
        <TabsList className="w-full justify-between">
          <TabsTrigger value="edit" className="w-1/2">
            <Wand2 className="mr-2 h-4 w-4" />
            Editar seAAo
          </TabsTrigger>
          <TabsTrigger value="image" className="w-1/2">
            <Sparkles className="mr-2 h-4 w-4" />
            Gerar imagem
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-4">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              handleEditSubmit(formData);
            }}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="pageRoute">
                PAgina
              </label>
              <select
                id="pageRoute"
                name="pageRoute"
                value={pageRoute}
                onChange={(event) => handlePageChange(event.target.value)}
                className="h-11 w-full rounded-xl border border-border/40 bg-background/80 px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brasa-purple"
              >
                {pages.map((page) => (
                  <option key={page.route} value={page.route}>
                    {page.title} ({page.route})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="sectionId">
                SeAAo
              </label>
              <select
                id="sectionId"
                name="sectionId"
                value={sectionId}
                onChange={(event) => setSectionId(event.target.value)}
                className="h-11 w-full rounded-xl border border-border/40 bg-background/80 px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brasa-purple"
              >
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.type} a {section.headline}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground" htmlFor="providerId">
                  Provedor
                </label>
                <Input id="providerId" name="providerId" defaultValue="openai" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground" htmlFor="model">
                  Modelo
                </label>
                <Input id="model" name="model" defaultValue="gpt-4o-mini" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="instruction">
                InstruAAes
              </label>
              <Textarea
                id="instruction"
                name="instruction"
                placeholder="Descreva como a seAAo deve ser ajustada (tom, CTA, elementos, etc.)."
                defaultValue={defaultPrompt}
              />
            </div>
            <Button type="submit" disabled={isEditing} className="w-full">
              {isEditing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando instruAAo...
                </>
              ) : (
                "Criar job de ediAAo"
              )}
            </Button>
          </form>
          {editMessage && (
            <p className="rounded-2xl border border-border/40 bg-muted/20 p-3 text-sm text-muted-foreground">{editMessage}</p>
          )}
        </TabsContent>

        <TabsContent value="image" className="space-y-4">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              handleImageSubmit(formData);
            }}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground" htmlFor="imageProvider">
                  Provedor
                </label>
                <Input id="imageProvider" name="imageProvider" defaultValue="openai" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground" htmlFor="size">
                  Tamanho
                </label>
                <select
                  id="size"
                  name="size"
                  defaultValue="1024x1024"
                  className="h-11 w-full rounded-xl border border-border/40 bg-background/80 px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brasa-purple"
                >
                  <option value="256x256">256 x 256</option>
                  <option value="512x512">512 x 512</option>
                  <option value="1024x1024">1024 x 1024</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="imagePrompt">
                Prompt da imagem
              </label>
              <Textarea
                id="imagePrompt"
                name="imagePrompt"
                placeholder="Ex.: Hero com equipe brasileira, estilo semi-realista, iluminaAAo roxa."
              />
            </div>
            <Button type="submit" disabled={isGeneratingImage} className="w-full" variant="secondary">
              {isGeneratingImage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando imagem...
                </>
              ) : (
                "Gerar imagem"
              )}
            </Button>
          </form>
          {imageMessage && (
            <p className="rounded-2xl border border-border/40 bg-muted/20 p-3 text-sm text-muted-foreground">{imageMessage}</p>
          )}
        </TabsContent>
      </Tabs>
    </aside>
  );
}

