import { NextResponse } from "next/server";
import { z } from "zod";

import { getUserServer } from "@/lib/auth";
import { logApiCall } from "@/lib/api/log";
import { buildSiteZip } from "@/lib/export/site-zip";
import type { SiteJSON } from "@/lib/ai/site-schema";
import { spendCredits } from "@/lib/guard/credits";
import { getSupabaseServiceRoleClient } from "@/lib/supabase";

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const startedAt = Date.now();

  try {
    const user = await getUserServer();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = ParamsSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid site id" }, { status: 400 });
    }

    const supabase = getSupabaseServiceRoleClient();
    const [{ data: site }, { data: pages }] = await Promise.all([
      supabase
        .from("sites")
        .select("id, title, user_id")
        .eq("id", parsed.data.id)
        .eq("user_id", user.id)
        .single(),
      supabase.from("site_pages").select("content").eq("site_id", parsed.data.id).order("created_at", {
        ascending: true,
      }),
    ]);

    if (!site) {
      return NextResponse.json({ error: "Site nao encontrado" }, { status: 404 });
    }

    const siteJsaon = pages?.[0]?.content as SiteJSON | undefined;
    if (!siteJsaon) {
      return NextResponse.json({ error: "Site nao possui conteudo para exportar" }, { status: 400 });
    }

    const zipBuffer = await buildSiteZip({
      site: siteJsaon,
      projectName: `${site.title.replace(/\s+/g, "-").toLowerCase()}-export`,
    });

    const filename = `${user.id}/${site.id}-${Date.now()}.zip`;

    const upload = await supabase.storage.from("site-exports").upload(filename, zipBuffer, {
      contentType: "application/zip",
      upsert: true,
    });

    if (upload.error) {
      throw upload.error;
    }

    const publicUrl = supabase.storage.from("site-exports").getPublicUrl(filename).data.publicUrl;

    await spendCredits(user.id, {
      amount: 15,
      reasaon: "site_export",
      referenceId: filename,
    });

    await logApiCall({
      route: "/api/sites/[id]/export",
      userId: user.id,
      status: 200,
      durationMs: Date.now() - startedAt,
      costInCredits: 15,
    });

    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (error) {
    consaole.error("export-site error", error);
    await logApiCall({
      route: "/api/sites/[id]/export",
      status: 500,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: "Erro ao gerar exportacao" }, { status: 500 });
  }
}
