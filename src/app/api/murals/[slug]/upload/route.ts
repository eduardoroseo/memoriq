import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBucket } from "@/lib/env";

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

function rand() {
  return crypto.randomUUID();
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/murals/[slug]/upload">
) {
  const { slug } = await ctx.params;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const name = String(form.get("name") ?? "").trim();
  const caption = String(form.get("caption") ?? "").trim();
  const file = form.get("photo");

  if (!name) {
    return NextResponse.json({ error: "Informe seu nome." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Selecione uma foto." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Foto muito grande (máx. 15MB)." },
      { status: 413 }
    );
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Formato não suportado." },
      { status: 415 }
    );
  }

  const admin = createAdminClient();

  const { data: mural, error: muralError } = await admin
    .from("murals")
    .select("id, requires_approval")
    .eq("slug", slug)
    .single();

  if (muralError || !mural) {
    return NextResponse.json(
      { error: "Mural não encontrado." },
      { status: 404 }
    );
  }

  const ext = EXT[file.type] ?? "jpg";
  const path = `${mural.id}/${rand()}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from(getBucket())
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json(
      { error: "Falha ao enviar a foto." },
      { status: 500 }
    );
  }

  const { error: insertError } = await admin.from("photos").insert({
    mural_id: mural.id,
    uploader_name: name.slice(0, 80),
    caption: caption ? caption.slice(0, 280) : null,
    storage_path: path,
    approved: !mural.requires_approval,
  });

  if (insertError) {
    await admin.storage.from(getBucket()).remove([path]);
    return NextResponse.json(
      { error: "Falha ao registrar a foto." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    pending: mural.requires_approval,
  });
}
