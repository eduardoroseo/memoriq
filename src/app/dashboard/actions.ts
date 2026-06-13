"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBucket } from "@/lib/env";
import { randomSuffix, slugify } from "@/lib/slug";

export type CreateMuralState = { error: string | null; slug?: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function createMural(
  _prev: CreateMuralState,
  formData: FormData
): Promise<CreateMuralState> {
  const name = String(formData.get("name") ?? "").trim();
  const requiresApproval = formData.get("requires_approval") === "on";

  if (!name) return { error: "Dê um nome ao mural." };

  const { supabase, user } = await requireUser();

  const base = slugify(name) || "mural";
  let slug = base;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await supabase.from("murals").insert({
      owner_id: user.id,
      name,
      slug,
      requires_approval: requiresApproval,
    });

    if (!error) {
      revalidatePath("/dashboard");
      return { error: null, slug };
    }

    if (error.code === "23505") {
      slug = `${base}-${randomSuffix()}`;
      continue;
    }

    return { error: "Não foi possível criar o mural." };
  }

  return { error: "Não foi possível gerar um link único. Tente outro nome." };
}

export async function setRequiresApproval(formData: FormData) {
  const muralId = String(formData.get("mural_id") ?? "");
  const requiresApproval = formData.get("requires_approval") === "true";
  const { supabase } = await requireUser();
  await supabase
    .from("murals")
    .update({ requires_approval: requiresApproval })
    .eq("id", muralId);
  revalidatePath("/dashboard");
}

export async function approvePhoto(formData: FormData) {
  const photoId = String(formData.get("photo_id") ?? "");
  const { supabase } = await requireUser();
  await supabase.from("photos").update({ approved: true }).eq("id", photoId);
  revalidatePath("/dashboard");
}

export async function deletePhoto(formData: FormData) {
  const photoId = String(formData.get("photo_id") ?? "");
  const { supabase } = await requireUser();

  const { data: photo } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("id", photoId)
    .single();

  await supabase.from("photos").delete().eq("id", photoId);

  if (photo?.storage_path) {
    const admin = createAdminClient();
    await admin.storage.from(getBucket()).remove([photo.storage_path]);
  }

  revalidatePath("/dashboard");
}

export async function deleteMural(formData: FormData) {
  const muralId = String(formData.get("mural_id") ?? "");
  const { supabase } = await requireUser();

  const { data: photos } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("mural_id", muralId);

  await supabase.from("murals").delete().eq("id", muralId);

  if (photos && photos.length > 0) {
    const admin = createAdminClient();
    await admin.storage
      .from(getBucket())
      .remove(photos.map((p) => p.storage_path));
  }

  revalidatePath("/dashboard");
}
