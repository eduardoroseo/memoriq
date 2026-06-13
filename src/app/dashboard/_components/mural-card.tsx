"use client";

import { useState } from "react";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  QrCode,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { Mural, PhotoWithUrl } from "@/lib/types";
import {
  approvePhoto,
  deleteMural,
  deletePhoto,
  setRequiresApproval,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function MuralCard({
  mural,
  pendingPhotos,
}: {
  mural: Mural;
  pendingPhotos: PhotoWithUrl[];
}) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const uploadUrl = `${origin}/m/${mural.slug}`;
  const wallUrl = `${origin}/m/${mural.slug}/wall`;

  async function copyLink() {
    await navigator.clipboard.writeText(uploadUrl);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadQr() {
    const canvas = document.getElementById(
      `qr-${mural.id}`
    ) as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-${mural.slug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div className="min-w-0">
          <p className="truncate font-semibold">{mural.name}</p>
          <p className="truncate text-xs text-muted-foreground">/m/{mural.slug}</p>
        </div>
        <form action={deleteMural}>
          <input type="hidden" name="mural_id" value={mural.id} />
          <Button
            variant="ghost"
            size="icon"
            type="submit"
            aria-label="Excluir mural"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </form>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={copyLink}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copiar link
          </Button>

          <Dialog open={qrOpen} onOpenChange={setQrOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <QrCode className="h-4 w-4" />
                QR Code
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xs">
              <DialogHeader>
                <DialogTitle>{mural.name}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-lg bg-white p-4">
                  <QRCodeCanvas
                    id={`qr-${mural.id}`}
                    value={uploadUrl}
                    size={220}
                    level="M"
                    marginSize={2}
                  />
                </div>
                <p className="break-all text-center text-xs text-muted-foreground">
                  {uploadUrl}
                </p>
                <Button variant="secondary" size="sm" onClick={downloadQr}>
                  <Download className="h-4 w-4" />
                  Baixar QR
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button asChild variant="default" size="sm">
            <Link href={wallUrl} target="_blank">
              <ExternalLink className="h-4 w-4" />
              Abrir telão
            </Link>
          </Button>
        </div>

        <form
          action={setRequiresApproval}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <input type="hidden" name="mural_id" value={mural.id} />
          <input
            type="hidden"
            name="requires_approval"
            value={(!mural.requires_approval).toString()}
          />
          <div className="pr-4">
            <p className="text-sm font-medium">Aprovar fotos</p>
            <p className="text-xs text-muted-foreground">
              {mural.requires_approval
                ? "Fotos aguardam sua aprovação."
                : "Fotos aparecem na hora."}
            </p>
          </div>
          <Switch
            checked={mural.requires_approval}
            type="submit"
            aria-label="Alternar aprovação"
          />
        </form>

        {mural.requires_approval && (
          <div>
            <p className="mb-2 text-sm font-medium">
              Aguardando aprovação ({pendingPhotos.length})
            </p>
            {pendingPhotos.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhuma foto pendente.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {pendingPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative overflow-hidden rounded-md border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={photo.caption ?? photo.uploader_name}
                      className="aspect-square w-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/60 p-1">
                      <form action={approvePhoto}>
                        <input
                          type="hidden"
                          name="photo_id"
                          value={photo.id}
                        />
                        <button
                          type="submit"
                          aria-label="Aprovar"
                          className="rounded bg-primary p-1 text-primary-foreground"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      </form>
                      <form action={deletePhoto}>
                        <input
                          type="hidden"
                          name="photo_id"
                          value={photo.id}
                        />
                        <button
                          type="submit"
                          aria-label="Recusar"
                          className="rounded bg-destructive p-1 text-destructive-foreground"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
