import { notFound } from "next/navigation";
import { Camera } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { UploadForm } from "./upload-form";

export default async function UploadPage(props: PageProps<"/m/[slug]">) {
  const { slug } = await props.params;

  const admin = createAdminClient();
  const { data: mural } = await admin
    .from("murals")
    .select("name, slug")
    .eq("slug", slug)
    .single();

  if (!mural) notFound();

  return (
    <main className="flex min-h-dvh flex-col items-center bg-background px-5 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <Camera className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">{mural.name}</h1>
          <p className="text-sm text-muted-foreground">
            Envie uma foto e ela aparecerá no telão do evento.
          </p>
        </div>
        <UploadForm slug={mural.slug} />
      </div>
    </main>
  );
}
