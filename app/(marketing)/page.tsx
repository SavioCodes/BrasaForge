"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listProviders } from "@/lib/providers";

const providers = listProviders();

const plans = [
  {
    name: "Starter",
    price: 149,
    credits: "20 projetos por mes",
    perks: [
      "Preview ilimitado com marca dagua",
      "3 exports incluidos",
      "Copy em portugues do Brasil",
      "Suporte por e-mail",
    ],
  },
  {
    name: "Pro",
    price: 349,
    credits: "60 projetos por mes",
    perks: [
      "10 exports incluidos",
      "Colaboracao com ate 3 membros",
      "Custom domains e deploy em um clique",
      "Prioridade na fila e suporte dedicado",
    ],
    highlighted: true,
  },
];

const faqs = [
  {
    question: "Posso editar o site depois da geracao?",
    answer:
      "Sim. Ajuste no editor do dashboard ou exporte o codigo Next.js para personalizar tudo como quiser.",
  },
  {
    question: "Como funcionam os creditos?",
    answer:
      "Cada tarefa consome creditos de acordo com o provedor e o modelo. Os planos incluem uma cota mensal e voce pode comprar creditos extras quando precisar.",
  },
  {
    question: "Existe biblioteca de templates?",
    answer:
      "Sim. Ha modelos prontos para nichos brasileiros como infoprodutos, gastronomia e imobiliarias. Tudo pode ser editado pela IA.",
  },
];

const highlights = [
  {
    title: "Prompt para site completo",
    description:
      "A IA gera sitemap, secoes, copy otimizada para SEO, integracoes e assets de marca em poucos minutos.",
  },
  {
    title: "Visual em tempo real",
    description:
      "Converse com a IA, veja o layout mudar na hora e reutilize blocos com shadcn/ui e Tailwind.",
  },
  {
    title: "Exportar ou publicar",
    description:
      "Baixe um projeto Next.js com Supabase pronto ou publique na Vercel em um clique.",
  },
];

const flow = [
  { step: "1", title: "Conte sobre o projeto", description: "Defina setor, paleta, tom de voz e objetivo. A IA cria briefing, sitemap e voz de marca." },
  { step: "2", title: "Escolha o provedor", description: "Selecione OpenAI, Anthropic ou Google. Veja a estimativa de creditos antes de confirmar a geracao." },
  { step: "3", title: "Revise e publique", description: "Edite secoes com comandos naturais, gere imagens e exporte ou publique na Vercel." },
];

const segments = [
  "Agencias digitais que produzem landing pages em serie",
  "Criadores de conteudo e infoprodutores com funis completos",
  "Negocios locais como restaurantes, studios e imobiliarias",
  "Squads que prototipam rapidamente com Supabase e Tailwind",
];

export default function MarketingPage() {
  return (
    <main className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.35),_transparent_65%)]" />

      <section className="container space-y-16 py-24">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur">
            IA brasileira para criacao de sites e identidade completa
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold text-white md:text-6xl">
            Gere sites modernos com IA, Next.js e Supabase em minutos.
          </h1>
          <p className="mt-6 text-lg text-white/80 md:text-xl">
            BrasaForge transforma prompts em projetos com layout, copy, banco de dados, automacoes e assets de marca. Ideal para agencias, freelancers e squads que precisam entregar rapido sem abrir mao de qualidade.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="rounded-full px-8 py-6 text-base font-semibold">
              <Link href="/dashboard/generate">Comecar agora</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/40 px-8 py-6 text-base text-white hover:bg-white/10"
            >
              <Link href="/dashboard">Ver o painel</Link>
            </Button>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-sm text-white/60">
            {providers.map((provider) => (
              <span
                key={provider.id}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 uppercase tracking-widest"
              >
                {provider.label}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="grid gap-6 md:grid-cols-3"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {highlights.map((feature) => (
            <Card
              key={feature.title}
              className="border-white/10 bg-white/5 text-white backdrop-blur transition hover:-translate-y-1 hover:border-white/20"
            >
              <CardHeader>
                <CardTitle className="text-2xl font-semibold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/70">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </section>

      <section className="container grid gap-8 py-24 md:grid-cols-[1.2fr,1fr]">
        <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-white backdrop-blur">
          <h2 className="font-display text-3xl font-bold">Fluxo em tres passos</h2>
          <div className="space-y-10">
            {flow.map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg font-semibold">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-sm text-white/70">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white backdrop-blur">
          <h3 className="font-display text-2xl font-semibold text-white">Perfeito para</h3>
          <ul className="mt-6 space-y-4 text-sm">
            {segments.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container py-24">
        <h2 className="text-center font-display text-3xl font-bold text-white">Planos e creditos</h2>
        <p className="mt-4 text-center text-white/70">
          Escolha o plano ideal e pague apenas pelos exports adicionais quando precisar.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative border-white/10 bg-white/5 text-white backdrop-blur ${plan.highlighted ? "ring-2 ring-brasa-purple/70" : ""}`}
            >
              {plan.highlighted && (
                <span className="absolute -top-4 right-6 rounded-full bg-brasa-purple px-3 py-1 text-xs font-semibold uppercase">
                  Mais popular
                </span>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <p className="text-lg text-white/80">R$ {plan.price} / mes - {plan.credits}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-white/70">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-brasa-purple" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild size="lg" className="mt-6 w-full">
                  <Link href="/dashboard/billing">Assinar</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container grid gap-10 py-24 md:grid-cols-[1.2fr,1fr]">
        <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-white backdrop-blur">
          <h2 className="font-display text-3xl font-bold">Perguntas frequentes</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.question} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <summary className="cursor-pointer text-lg font-semibold text-white">{faq.question}</summary>
                <p className="mt-3 text-sm text-white/70">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white backdrop-blur">
          <h3 className="font-display text-2xl font-semibold">Pronto para colocar a IA para trabalhar?</h3>
          <p className="mt-4 text-sm text-white/70">
            Teste gratuitamente por sete dias com marca dagua e veja como e facil gerar sites completos para seus clientes.
          </p>
          <Button asChild size="lg" className="mt-6 w-full">
            <Link href="/dashboard/generate">Criar projeto</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
