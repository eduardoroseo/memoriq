import { redirect } from "next/navigation";
import { Camera, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signPhotos } from "@/lib/photos";
import type { Mural, Photo } from "@/lib/types";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { CreateMuralDialog } from "./_components/create-mural-dialog";
import { MuralCard } from "./_components/mural-card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: murals } = await supabase
    .from("murals")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Mural[]>();

  const muralList = murals ?? [];

  const { data: pending } = await supabase
    .from("photos")
    .select("*")
    .eq("approved", false)
    .order("created_at", { ascending: true })
    .returns<Photo[]>();

  const pendingWithUrls = await signPhotos(pending ?? []);
  const pendingByMural = new Map<string, typeof pendingWithUrls>();
  for (const photo of pendingWithUrls) {
    const list = pendingByMural.get(photo.mural_id) ?? [];
    list.push(photo);
    pendingByMural.set(photo.mural_id, list);
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b bg-sidebar">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold leading-tight">Memoriq</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <form action={logout}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Seus murais</h1>
            <p className="text-sm text-muted-foreground">
              Crie um mural, compartilhe o QR Code e exiba as fotos no telão.
            </p>
          </div>
          <CreateMuralDialog />
        </div>

        {muralList.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            Nenhum mural ainda. Crie o primeiro para começar.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {muralList.map((mural) => (
              <MuralCard
                key={mural.id}
                mural={mural}
                pendingPhotos={pendingByMural.get(mural.id) ?? []}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
