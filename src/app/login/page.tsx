import { LoginForm } from "./login-form";

export default async function LoginPage(props: PageProps<"/login">) {
  const { redirect } = await props.searchParams;
  const redirectTo = typeof redirect === "string" ? redirect : "/dashboard";

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6">
      <LoginForm redirectTo={redirectTo} />
    </main>
  );
}
