"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize, QrCode } from "lucide-react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createRealtimeClient } from "@/lib/supabase/realtime";
import type { Photo, PhotoWithUrl } from "@/lib/types";

const MAX_PHOTOS = 80;

async function fetchUrl(id: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/photos/${id}/url`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.url ?? null;
  } catch {
    return null;
  }
}

export function Wall({
  muralId,
  muralName,
  initialPhotos,
}: {
  muralId: string;
  muralName: string;
  initialPhotos: PhotoWithUrl[];
}) {
  const [photos, setPhotos] = useState<PhotoWithUrl[]>(initialPhotos);
  const seen = useRef(new Set(initialPhotos.map((p) => p.id)));
  const containerRef = useRef<HTMLDivElement>(null);

  const addPhoto = useCallback(async (photo: Photo) => {
    if (seen.current.has(photo.id)) return;
    seen.current.add(photo.id);
    const url = await fetchUrl(photo.id);
    if (!url) return;
    setPhotos((prev) => [{ ...photo, url }, ...prev].slice(0, MAX_PHOTOS));
  }, []);

  useEffect(() => {
    const supabase = createRealtimeClient();
    const channel = supabase
      .channel(`wall:${muralId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "photos",
          filter: `mural_id=eq.${muralId}`,
        },
        (payload: RealtimePostgresChangesPayload<Photo>) => {
          const row = payload.new as Photo;
          if (row?.approved) void addPhoto(row);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "photos",
          filter: `mural_id=eq.${muralId}`,
        },
        (payload: RealtimePostgresChangesPayload<Photo>) => {
          const row = payload.new as Photo;
          if (row?.approved) void addPhoto(row);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [muralId, addPhoto]);

  function goFullscreen() {
    containerRef.current?.requestFullscreen?.();
  }

  return (
    <div
      ref={containerRef}
      className="relative min-h-dvh w-full overflow-hidden bg-background"
    >
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-background/90 to-transparent p-6">
        <h1 className="text-2xl font-bold text-foreground drop-shadow sm:text-3xl">
          {muralName}
        </h1>
        <button
          onClick={goFullscreen}
          className="pointer-events-auto flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow"
        >
          <Maximize className="h-4 w-4" />
          Tela cheia
        </button>
      </header>

      {photos.length === 0 ? (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 text-center text-muted-foreground">
          <QrCode className="h-16 w-16" />
          <p className="text-xl font-medium">
            Aguardando as primeiras fotos...
          </p>
          <p className="text-sm">Escaneie o QR Code e participe!</p>
        </div>
      ) : (
        <div className="columns-2 gap-3 p-3 pt-24 sm:columns-3 lg:columns-4 xl:columns-5">
          {photos.map((photo) => (
            <figure
              key={photo.id}
              className="mb-3 break-inside-avoid overflow-hidden rounded-xl border bg-card shadow-sm animate-in fade-in zoom-in-95 duration-500"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.caption ?? photo.uploader_name}
                className="w-full object-cover"
                loading="lazy"
              />
              <figcaption className="px-3 py-2">
                {photo.caption && (
                  <p className="text-sm text-card-foreground">{photo.caption}</p>
                )}
                <p className="text-xs font-medium text-muted-foreground">
                  — {photo.uploader_name}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
