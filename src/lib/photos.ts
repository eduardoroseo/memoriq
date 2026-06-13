import { createAdminClient } from "@/lib/supabase/admin";
import { getBucket } from "@/lib/env";
import type { Photo, PhotoWithUrl } from "@/lib/types";

const SIGNED_URL_TTL = 60 * 60 * 6;

export async function signPhotos(photos: Photo[]): Promise<PhotoWithUrl[]> {
  if (photos.length === 0) return [];
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(getBucket())
    .createSignedUrls(
      photos.map((p) => p.storage_path),
      SIGNED_URL_TTL
    );

  if (error || !data) return [];

  return photos.map((photo, i) => ({
    ...photo,
    url: data[i]?.signedUrl ?? "",
  }));
}

export async function signPhotoPath(path: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(getBucket())
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (error || !data) return null;
  return data.signedUrl;
}
