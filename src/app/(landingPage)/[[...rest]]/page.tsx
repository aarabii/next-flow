import { auth } from "@clerk/nextjs/server";
import { SignIn } from "@clerk/nextjs";
import { redirect, notFound } from "next/navigation";

export default async function Home({ params }: { params: Promise<{ rest?: string[] }> }) {
  const resolvedParams = await params;
  const rest = resolvedParams.rest || [];
  
  const lastSegment = rest[rest.length - 1];
  if (lastSegment && (lastSegment.includes(".") || lastSegment === "favicon.ico")) {
    notFound();
  }

  const { isAuthenticated, userId } = await auth();

  if (isAuthenticated && userId) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <SignIn withSignUp={true} path="/" />
    </main>
  );
}
