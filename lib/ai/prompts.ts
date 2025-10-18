import { SiteJSON } from "@/lib/ai/site-schema";

interface GenerateSitePromptInput {
  sector: string;
  tone: string;
  palette?: string;
  locale?: string;
  additionalInstructions?: string;
}

export function buildSitePrompt(input: GenerateSitePromptInput) {
  const locale = input.locale ?? "pt-BR";

  return [
    "Voce e uma IA especialista em criacao de sites para o mercado brasileiro.",
    `Gere um JSON que siga o esquema abaixo (SiteJSON) para um site do setor: ${input.sector}.`,
    `Tom de voz: ${input.tone}. Paleta sugerida: ${input.palette ?? "Navy escuro com roxo vibrante"}.`,
    "O site deve incluir hero, destaques, prova social, plano de precos, FAQ, CTA final e bloco de SEO (tags).",
    "Escreva copy em portugues brasileiro, clara, objetiva e adequada ao publico alvo.",
    "Cada secao deve indicar componentes, textos, CTAs, imagens sugeridas e dados estruturados.",
    input.additionalInstructions ? `Instrucoes extras: ${input.additionalInstructions}` : "",
    "Retorne apenas JSON valido alinhado ao tipo SiteJSON (sem markdown).",
    JSON.stringify(siteJsonSchemaDescription, null, 2),
    `locale: ${locale}`,
  ]
    .filter(Boolean)
    .join("\n");
}

const siteJsonSchemaDescription = {
  version: "1.0.0",
  site: {
    name: "string",
    description: "string",
    locale: "string",
    palette: {
      primary: "string",
      secondary: "string",
      background: "string",
      accent: "string",
    },
  },
  pages: [
    {
      route: "/",
      title: "string",
      seo: {
        title: "string",
        description: "string",
        keywords: ["string"],
      },
      sections: [
        {
          id: "string",
          type: "hero|features|cta|pricing|faq|testimonials|gallery|stats|contact|footer",
          headline: "string",
          subhead: "string",
          body: "string",
          media: [
            {
              kind: "image|video",
              prompt: "string",
              alt: "string",
            },
          ],
          actions: [
            {
              label: "string",
              href: "string",
              style: "primary|secondary|ghost",
            },
          ],
          items: [
            {
              title: "string",
              description: "string",
              icon: "string",
            },
          ],
          metadata: {
            layout: "grid|list|carousel",
            ariaLabel: "string",
          },
        },
      ],
    },
  ],
};

export function sitePromptToJson(prompt: string): SiteJSON | null {
  try {
    return JSON.parse(prompt) as SiteJSON;
  } catch (error) {
    console.error("Failed to parse SiteJSON", error);
    return null;
  }
}
