
import "dotenv/config";

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SEED_USER_EMAIL = process.env.SEED_USER_EMAIL ?? "founder@brasa.dev";
const SEED_USER_PASSWORD = process.env.SEED_USER_PASSWORD ?? "BrasaForge#2025";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function ensureSeedUser() {
  const existing = await supabase.auth.admin.getUserByEmail(SEED_USER_EMAIL);
  if (existing.data.user) {
    return existing.data.user.id;
  }

  const result = await supabase.auth.admin.createUser({
    email: SEED_USER_EMAIL,
    password: SEED_USER_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Usuario Seed Brasa Forge" },
  });

  if (result.error || !result.data.user) {
    throw new Error(`Unable to create seed user: ${result.error?.message}`);
  }

  return result.data.user.id;
}

async function loadTemplates() {
  const templatesDir = path.join(process.cwd(), "scripts", "templates");
  const files = fs.readdirSync(templatesDir).filter((file) => file.endsWith(".json"));

  return files.map((file) => {
    const raw = fs.readFileSync(path.join(templatesDir, file), "utf-8");
    return { name: file.replace(".json", ""), payload: JSON.parse(raw) };
  });
}

async function seed() {
  const userId = await ensureSeedUser();

  await supabase
    .from("profiles")
    .upsert({
      id: userId,
      plan: "pro",
      credits_total: 2000,
      credits_used: 0,
    })
    .throwOnError();

  const templates = await loadTemplates();

  for (const template of templates) {
    const siteInsert = await supabase
      .from("sites")
      .insert({
        user_id: userId,
        title: template.payload.site.name,
        status: "published",
        provider_id: "seed",
        model: "template",
        palette: JSON.stringify(template.payload.site.palette),
        sector: template.name,
        last_prompt: template.payload.site.description,
      })
      .select("id")
      .single();

    if (siteInsert.error || !siteInsert.data) {
      console.error(`Failed to create site for template ${template.name}:`, siteInsert.error?.message);
      continue;
    }

    const siteId = siteInsert.data.id;

    await supabase
      .from("site_pages")
      .insert({
        site_id: siteId,
        route: template.payload.pages[0]?.route ?? "/",
        content: template.payload,
      })
      .throwOnError();

    console.log(`Seeded template ${template.name} into site ${siteId}`);
  }

  console.log("Seed completed successfully.");
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});

