import Link from "next/link";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <Camera className="h-8 w-8" />
      </div>
      <div>
        <h1 className="text-4xl font-bold">Memoriq</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Mural de fotos ao vivo para o seu evento. Convidados enviam fotos por
          QR Code e elas aparecem no telão na hora.
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/login">Acessar painel</Link>
      </Button>
    </main>
  );
}
