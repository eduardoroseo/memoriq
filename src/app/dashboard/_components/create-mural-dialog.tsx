"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createMural } from "../actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function CreateMuralDialog() {
  const [open, setOpen] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createMural({ error: null }, formData);
      if (result.slug) {
        toast.success("Mural criado!");
        setRequiresApproval(false);
        setOpen(false);
      } else if (result.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Novo mural
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar mural</DialogTitle>
          <DialogDescription>
            Dê um nome ao evento. Um link e QR Code serão gerados.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome do evento</Label>
            <Input
              id="name"
              name="name"
              placeholder="Chá de Fraldas da Maria"
              required
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="pr-4">
              <Label htmlFor="requires_approval">Aprovar fotos</Label>
              <p className="text-xs text-muted-foreground">
                Se ativo, você aprova cada foto antes de aparecer no telão.
              </p>
            </div>
            <Switch
              id="requires_approval"
              name="requires_approval"
              checked={requiresApproval}
              onCheckedChange={setRequiresApproval}
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Criar mural
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
