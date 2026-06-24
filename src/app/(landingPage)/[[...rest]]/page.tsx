import { auth } from "@clerk/nextjs/server";
import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function Home() {
  const { isAuthenticated, userId } = await auth();

  if (isAuthenticated && userId) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <SignIn withSignUp={true} path="/" />
    </main>
  );
}
