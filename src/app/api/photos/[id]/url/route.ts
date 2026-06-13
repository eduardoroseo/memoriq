import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signPhotoPath } from "@/lib/photos";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/photos/[id]/url">
) {
  const { id } = await ctx.params;

  const admin = createAdminClient();
  const { data: photo } = await admin
    .from("photos")
    .select("storage_path, approved")
    .eq("id", id)
    .single();

  if (!photo || !photo.approved) {
    return NextResponse.json({ error: "Não encontrada." }, { status: 404 });
  }

  const url = await signPhotoPath(photo.storage_path);
  if (!url) {
    return NextResponse.json({ error: "Falha ao assinar." }, { status: 500 });
  }

  return NextResponse.json({ url });
}
