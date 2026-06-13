"use client";

import { useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Status = "idle" | "sending" | "done";

export function UploadForm({ slug }: { slug: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    if (!(data.get("photo") instanceof File) || (data.get("photo") as File).size === 0) {
      toast.error("Selecione uma foto.");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch(`/api/murals/${slug}/upload`, {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Falha ao enviar.");
        setStatus("idle");
        return;
      }
      setPending(Boolean(json.pending));
      setStatus("done");
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      form.reset();
    } catch {
      toast.error("Sem conexão. Tente novamente.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          {pending ? (
            <>
              <CheckCircle2 className="h-12 w-12 text-primary" />
              <p className="font-semibold">Foto enviada!</p>
              <p className="text-sm text-muted-foreground">
                Ela aparecerá no telão após a aprovação dos organizadores.
              </p>
            </>
          ) : (
            <>
              <PartyPopper className="h-12 w-12 text-primary" />
              <p className="font-semibold">Foto no telão! 🎉</p>
              <p className="text-sm text-muted-foreground">
                Sua foto já está sendo exibida no evento.
              </p>
            </>
          )}
          <Button onClick={() => setStatus("idle")} className="mt-2">
            Enviar outra foto
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="photo">Foto</Label>
            <label
              htmlFor="photo"
              className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed bg-muted/40 text-muted-foreground transition-colors hover:bg-muted"
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Pré-visualização"
                  className="h-full w-full object-cover"
                />
              ) : (
                <>
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-sm">Toque para escolher uma foto</span>
                </>
              )}
            </label>
            <Input
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onFileChange}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Seu nome</Label>
            <Input id="name" name="name" maxLength={80} required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="caption">Legenda (opcional)</Label>
            <Textarea
              id="caption"
              name="caption"
              maxLength={280}
              placeholder="Escreva uma mensagem carinhosa..."
            />
          </div>

          <Button type="submit" disabled={status === "sending"} size="lg">
            {status === "sending" && <Loader2 className="animate-spin" />}
            Enviar foto
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
