import JSZip from "jszip";

import { SiteJSON } from "@/lib/ai/site-schema";

interface BuildSiteZipOptions {
  site: SiteJSON;
  projectName?: string;
}

export async function buildSiteZip({ site, projectName = "brasa-site" }: BuildSiteZipOptions) {
  const zip = new JSZip();

  const pkg = {
    name: projectName,
    version: "0.1.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "next lint",
    },
    dependencies: {
      next: "15.0.0-canary",
      react: "18.3.0-canary-93369e8be0-20240531",
      "react-dom": "18.3.0-canary-93369e8be0-20240531",
      tailwindcss: "^3.4.10",
      autoprefixer: "^10.4.20",
      postcss: "^8.4.41",
      clsx: "^2.1.1",
    },
    devDependencies: {
      typescript: "^5.5.4",
    },
  };

  zip.file("package.json", JSON.stringify(pkg, null, 2));
  zip.file(
    "tsconfig.json",
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          lib: ["dom", "dom.iterable", "es2022"],
          allowJs: false,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          module: "esnext",
          moduleResaolution: "bundler",
          resaolveJsaonModule: true,
          isaolatedModules: true,
          jsx: "preserve",
          baseUrl: ".",
          paths: {
            "@/*": ["*"],
            "@/components/*": ["components/*"],
          },
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        exclude: ["node_modules"],
      },
      null,
      2,
    ),
  );

  zip.file(
    "tailwind.config.ts",
    `import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
`,
  );

  zip.file(
    "postcss.config.js",
    `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`,
  );

  zip.file(
    "next.config.ts",
    `import { defineConfig } from "next";

const nextConfig = defineConfig({
  experimental: {
    serverActions: {
      bodySizeLimit: "1mb",
    },
  },
});

export default nextConfig;`,
  );

  zip.file("site-data.json", JSON.stringify(site, null, 2));
  zip.file("next-env.d.ts", `/// <reference types="next" />\n/// <reference types="next/types/global" />\n`);

  zip.file(
    "styles/globals.css",
    `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
}

body {
  @apply bg-slate-950 text-slate-50 antialiased;
}`,
  );

  const app = zip.folder("app");
  app?.file(
    "layout.tsx",
    `import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "${site.site.name}",
  description: "${site.site.description}",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="${site.site.locale}">
      <body className="min-h-screen bg-slate-950 text-slate-50">{children}</body>
    </html>
  );
}
`,
  );

  const components = zip.folder("components");
  components?.file(
    "render-site.tsx",
    `import React from "react";
import data from "../site-data.json";

type SiteJSON = typeof data;

export function RenderSite({ site }: { site: SiteJSON }) {
  return (
    <main className="space-y-12 bg-slate-950 px-6 py-16">
      {site.pages.map((page) => (
        <section key={page.route} className="mx-auto max-w-5xl space-y-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-10">
          {page.sections.map((section) => (
            <article key={section.id} className="space-y-4">
              <h2 className="text-3xl font-semibold">{section.headline}</h2>
              {section.subhead && <p className="text-slate-300">{section.subhead}</p>}
              {section.body && <p className="text-slate-400">{section.body}</p>}
              {section.items?.length ? (
                <ul className="grid gap-4 sm:grid-cols-2">
                  {section.items.map((item) => (
                    <li key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                      <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                      <p className="text-sm text-slate-400">{item.description}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.actions?.length ? (
                <div className="flex flex-wrap gap-3">
                  {section.actions.map((action) => (
                    <a
                      key={action.label}
                      href={action.href}
                      className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900"
                    >
                      {action.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </section>
      ))}
    </main>
  );
}
`,
  );

  for (const page of site.pages) {
    if (page.route === "/") {
      continue;
    }
    const route = page.route === "/" ? "" : page.route.replace(/^\//, "");
    const folder = route ? app?.folder(route) : app;
    const depth = route ? route.split("/").filter(Boolean).length : 0;
    const backtrack = "../".repeat(depth + 2);
    const dataPath = `${backtrack}site-data.json`;
    const componentPath = `${backtrack}components/render-site`;

    folder?.file(
      "page.tsx",
      `import site from "${dataPath}";
import { RenderSite } from "${componentPath}";

export default function GeneratedPage() {
  const currentPage = site.pages.find((p) => p.route === "${page.route}");
  return (
    <RenderSite site={{ ...site, pages: currentPage ? [currentPage] : site.pages }} />
  );
}
`,
    );
  }

  app?.file(
    "page.tsx",
    `import site from "../../site-data.json";
import { RenderSite } from "../../components/render-site";

export default function HomePage() {
  return <RenderSite site={site} />;
}
`,
  );

  zip.file(
    "README.md",
    `# ${site.site.name}

Projeto gerado automaticamente pela Brasa Forge.

## Scripts

- \`npm install\`
- \`npm run dev\`
- \`npm run build\`

## sobre o conteAdo

O arquivo \`site-data.json\` contAm o JSON de seAAes e pAginas. Ajuste o renderizador em \`components/render-site.tsx\` para customizaAAo avanAada.
`,
  );

  return zip.generateAsync({ type: "nodebuffer" });
}

