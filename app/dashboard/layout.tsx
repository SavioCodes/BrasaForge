import Link from "next/link";
import { Suspense } from "react";

import { requireUser } from "@/lib/auth";
import { listProviders } from "@/lib/providers";

const navItems = [
  { href: "/dashboard", label: "Visao geral" },
  { href: "/dashboard/generate", label: "Gerar site" },
  { href: "/dashboard/sites", label: "Sites" },
  { href: "/dashboard/billing", label: "Assinatura" },
  { href: "/dashboard/settings", label: "Configuracoes" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/login");
  const providers = listProviders();

  return (
    <div className="flex min-h-screen flex-col bg-background/95 text-foreground md:flex-row">
      <aside className="flex w-full flex-col gap-6 border-b border-border/10 bg-brasa-navy/90 p-6 text-white md:h-screen md:w-72 md:border-b-0 md:border-r md:bg-brasa-navy">
        <Link href="/" className="font-display text-2xl font-bold tracking-tight text-white">
          Brasa Forge
        </Link>
        <div className="space-y-1 text-sm text-white/70">
          <p className="text-xs uppercase tracking-widest text-white/40">Voce esta logado como</p>
          <p className="font-medium">{user.email ?? user.user_metadata?.full_name}</p>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-3 py-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-widest text-white/50">LLM disponiveis</p>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            {providers.map((provider) => (
              <li key={provider.id} className="flex items-center justify-between">
                <span>{provider.label}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                  {provider.supportsImages ? "Texto + Imagem" : "Texto"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-gradient-to-b from-background via-background/90 to-background px-6 py-10">
        <Suspense fallback={<div className="text-sm text-muted-foreground">Carregando...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}

