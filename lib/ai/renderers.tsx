import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import type { SiteJSON, SitePage, SiteSection } from "./site-schema";

interface RenderSiteProps {
  data: SiteJSON;
}

export function RenderSite({ data }: RenderSiteProps) {
  return (
    <div className="flex w-full flex-col gap-12">
      {data.pages.map((page) => (
        <PageRenderer key={page.route} page={page} />
      ))}
    </div>
  );
}

interface PageRendererProps {
  page: SitePage;
}

function PageRenderer({ page }: PageRendererProps) {
  return (
    <section aria-label={page.title} className="space-y-12">
      {page.sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </section>
  );
}

interface SectionRendererProps {
  section: SiteSection;
}

function SectionRenderer({ section }: SectionRendererProps) {
  switch (section.type) {
    case "hero":
      return <HeroSection section={section} />;
    case "features":
      return <FeaturesSection section={section} />;
    case "cta":
      return <CTASection section={section} />;
    case "pricing":
      return <PricingSection section={section} />;
    case "faq":
      return <FAQSection section={section} />;
    case "testimonials":
      return <TestimonialsSection section={section} />;
    case "stats":
      return <StatsSection section={section} />;
    case "contact":
      return <ContactSection section={section} />;
    case "footer":
      return <FooterSection section={section} />;
    case "gallery":
      return <GallerySection section={section} />;
    default:
      return <GenericSection section={section} />;
  }
}

function SectionContainer({
  children,
  className,
  section,
}: {
  children: React.ReactNode;
  className?: string;
  section: SiteSection;
}) {
  const background =
    section.metadata?.background === "muted"
      ? "bg-muted/30"
      : section.metadata?.background === "accent"
        ? "bg-gradient-to-br from-brasa-indigo/80 via-brasa-purple/70 to-brasa-indigo/90 text-white"
        : "bg-transparent";

  return (
    <div
      className={cn(
        "rounded-3xl border border-border/20 p-8 shadow-sm transition hover:shadow-lg md:p-12",
        background,
        className,
      )}
      aria-label={section.metadata?.ariaLabel ?? section.headline}
    >
      {children}
    </div>
  );
}

function SectionHeader({ section }: { section: SiteSection }) {
  return (
    <div className="mb-8 flex flex-col gap-3">
      <Badge variant="outline" className="w-fit rounded-full border-brasa-purple/40 bg-brasa-purple/10 text-brasa-purple">
        {section.type.toUpperCase()}
      </Badge>
      <h2 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
        {section.headline}
      </h2>
      {section.subhead && <p className="max-w-2xl text-lg text-muted-foreground">{section.subhead}</p>}
    </div>
  );
}

const mediaGrid =
  "grid gap-4 sm:grid-cols-2 [&>img]:rounded-2xl [&>img]:border [&>img]:border-border [&>img]:object-cover [&>img]:shadow-lg";

function HeroSection({ section }: SectionRendererProps) {
  return (
    <SectionContainer section={section} className="bg-brasa-navy text-white">
      <div className="grid gap-10 md:grid-cols-[1.4fr,1fr] md:items-center">
        <div className="space-y-6">
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            {section.headline}
          </h1>
          {section.subhead && <p className="text-lg text-white/80">{section.subhead}</p>}
          {section.body && <p className="text-base text-white/70">{section.body}</p>}
          {section.actions && (
            <div className="flex flex-wrap gap-4">
              {section.actions.map((action) => (
                <Button key={action.label} size="lg" variant={action.style === "secondary" ? "secondary" : "default"} asChild>
                  <a href={action.href}>{action.label}</a>
                </Button>
              ))}
            </div>
          )}
        </div>
        {section.media?.length ? (
          <div className={mediaGrid}>
            {section.media.map((media) => (
              <figure key={media.prompt} className="overflow-hidden rounded-2xl bg-white/5 p-4 backdrop-blur">
                <div className="rounded-xl border border-white/10 bg-black/40 p-6 text-sm text-white/80">
                  {media.prompt}
                </div>
                <figcaption className="mt-2 text-xs uppercase tracking-wide text-white/50">{media.alt}</figcaption>
              </figure>
            ))}
          </div>
        ) : null}
      </div>
    </SectionContainer>
  );
}

function FeaturesSection({ section }: SectionRendererProps) {
  return (
    <SectionContainer section={section}>
      <SectionHeader section={section} />
      <div className="grid gap-6 md:grid-cols-3">
        {section.items?.map((item) => (
          <Card key={item.title} className="border-border/40 bg-background/60 shadow-sm backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                {item.icon && <span className="text-2xl">{item.icon}</span>}
                <CardTitle className="text-xl">{item.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionContainer>
  );
}

function CTASection({ section }: SectionRendererProps) {
  return (
    <SectionContainer
      section={section}
      className="bg-gradient-to-r from-brasa-purple/90 to-brasa-indigo/90 text-white"
    >
      <SectionHeader section={section} />
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {section.body && <p className="text-base text-white/80">{section.body}</p>}
        <div className="flex flex-wrap gap-3">
          {section.actions?.map((action) => (
            <Button key={action.label} size="lg" variant="secondary" asChild>
              <a href={action.href}>{action.label}</a>
            </Button>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}

function PricingSection({ section }: SectionRendererProps) {
  return (
    <SectionContainer section={section}>
      <SectionHeader section={section} />
      <div className="grid gap-6 md:grid-cols-3">
        {section.items?.map((item) => (
          <Card key={item.title} className="group border-border/40 bg-background/80 shadow-lg backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
              {item.stats && (
                <div className="space-y-2">
                  {Object.entries(item.stats).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{key}</span>
                      <span className="font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              )}
              {section.actions?.[0] && (
                <Button className="w-full" asChild>
                  <a href={section.actions[0].href}>{section.actions[0].label}</a>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionContainer>
  );
}

function FAQSection({ section }: SectionRendererProps) {
  return (
    <SectionContainer section={section}>
      <SectionHeader section={section} />
      <div className="space-y-4">
        {section.items?.map((item) => (
          <details key={item.title} className="rounded-2xl border border-border/30 bg-background/60 p-6 shadow-sm">
            <summary className="cursaor-pointer text-lg font-semibold">{item.title}</summary>
            <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
          </details>
        ))}
      </div>
    </SectionContainer>
  );
}

function TestimonialsSection({ section }: SectionRendererProps) {
  return (
    <SectionContainer section={section}>
      <SectionHeader section={section} />
      <div className="grid gap-6 md:grid-cols-2">
        {section.items?.map((item) => (
          <blockquote
            key={item.title}
            className="rounded-2xl border border-border/30 bg-background/70 p-6 shadow-sm backdrop-blur"
          >
            <p className="text-base italic text-muted-foreground">a{item.description}a</p>
            <footer className="mt-4 flex items-center justify-between">
              <span className="font-semibold">{item.title}</span>
              {item.icon && <span className="text-xs uppercase tracking-widest text-muted-foreground">{item.icon}</span>}
            </footer>
          </blockquote>
        ))}
      </div>
    </SectionContainer>
  );
}

function StatsSection({ section }: SectionRendererProps) {
  return (
    <SectionContainer section={section}>
      <SectionHeader section={section} />
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
        {section.items?.map((item) => (
          <div key={item.title} className="flex flex-col rounded-2xl border border-border/30 bg-background/60 p-6 text-center shadow-sm">
            <span className="text-3xl font-bold text-brasa-purple">{item.stats?.value ?? item.description}</span>
            <span className="mt-2 text-sm text-muted-foreground">{item.title}</span>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
}

function ContactSection({ section }: SectionRendererProps) {
  return (
    <SectionContainer section={section}>
      <SectionHeader section={section} />
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          {section.body && <p className="text-base text-muted-foreground">{section.body}</p>}
          <div className="mt-6 space-y-4">
            {section.items?.map((item) => (
              <div key={item.title} className="flex flex-col rounded-2xl border border-border/30 bg-background/60 p-4 shadow-sm">
                <span className="text-sm font-semibold uppercase text-muted-foreground">{item.title}</span>
                <span className="text-lg font-medium text-foreground">{item.description}</span>
              </div>
            ))}
          </div>
        </div>
        <Card className="border-border/40 bg-background/80 shadow-lg backdrop-blur">
          <CardHeader>
            <CardTitle>Envie uma mensagem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <label className="text-sm font-medium text-muted-foreground">Nome</label>
              <input
                aria-label="Seu nome"
                className="rounded-xl border border-border/40 bg-background/60 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brasa-purple"
                placeholder="Seu nome"
              />
            </div>
            <div className="grid gap-3">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <input
                aria-label="Seu email"
                className="rounded-xl border border-border/40 bg-background/60 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brasa-purple"
                placeholder="voce@empresa.com"
              />
            </div>
            <div className="grid gap-3">
              <label className="text-sm font-medium text-muted-foreground">Mensagem</label>
              <textarea
                aria-label="Sua mensagem"
                className="min-h-[120px] rounded-xl border border-border/40 bg-background/60 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brasa-purple"
                placeholder="Como podemos ajudar?"
              />
            </div>
            <Button className="w-full">Enviar mensagem</Button>
          </CardContent>
        </Card>
      </div>
    </SectionContainer>
  );
}

function GallerySection({ section }: SectionRendererProps) {
  return (
    <SectionContainer section={section}>
      <SectionHeader section={section} />
      <div className={mediaGrid}>
        {section.media?.map((media) => (
          <figure key={media.prompt} className="rounded-2xl border border-border/30 bg-background/70 p-4 shadow-sm">
            <div className="rounded-xl bg-muted/40 p-6 text-sm text-muted-foreground">{media.prompt}</div>
            <figcaption className="mt-2 text-xs text-muted-foreground">{media.alt}</figcaption>
          </figure>
        ))}
      </div>
    </SectionContainer>
  );
}

function FooterSection({ section }: SectionRendererProps) {
  return (
    <footer className="rounded-3xl border border-border/20 bg-brasa-navy/95 p-8 text-sm text-white/80">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="font-display text-xl text-white">{section.headline}</h3>
          {section.body && <p className="mt-3 max-w-lg text-white/70">{section.body}</p>}
        </div>
        <div className="grid gap-3 text-white/70">
          {section.items?.map((item) => (
            <a key={item.title} href={item.href} className="text-white/70 hover:text-white">
              {item.title}
            </a>
          ))}
        </div>
      </div>
      <Separator className="my-6 border-white/10" />
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs uppercase tracking-widest text-white/40">
        <span>{section.subhead}</span>
        <span>ConstruAdo com Brasa Forge</span>
      </div>
    </footer>
  );
}

function GenericSection({ section }: SectionRendererProps) {
  return (
    <SectionContainer section={section}>
      <SectionHeader section={section} />
      {section.body && <p className="text-base text-muted-foreground">{section.body}</p>}
      {section.items && (
        <div className="mt-6 space-y-4">
          {section.items.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border/30 bg-background/70 p-4 shadow-sm">
              <h4 className="text-lg font-semibold">{item.title}</h4>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      )}
    </SectionContainer>
  );
}

