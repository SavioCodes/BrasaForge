import type { Metadata } from "next";
import { Inter, Space_Grotesk as SpaceGrotesk } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import "@/styles/globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = SpaceGrotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Brasa Forge | IA de criacao de sites",
  description:
    "Brasa Forge cria sites completos em segundos com IA, Next.js e Supabase para o mercado brasileiro.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Brasa Forge",
    description: "Gere sites completos com IA. Foco no Brasil.",
    type: "website",
    locale: "pt_BR",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brasa Forge",
    description: "Construa sites completos com IA focada no Brasil.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans text-foreground antialiased",
          inter.variable,
          spaceGrotesk.variable,
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <div className="min-h-screen bg-gradient-to-b from-brasa-navy via-background to-background">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
