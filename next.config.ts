import { defineConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig = defineConfig({
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    ppr: true,
    serverWebsocket: true,
  },
  eslint: {
    dirs: ["app", "components", "lib", "scripts", "tests"],
  },
  compiler: {
    removeConsole: isProd ? { exclude: ["error", "warn"] } : false,
  },
  poweredByHeader: false,
});

export default nextConfig;
