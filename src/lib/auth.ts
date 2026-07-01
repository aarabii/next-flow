import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "./prisma";

export async function checkAndSyncUser() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  let dbUser = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!dbUser) {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      redirect("/");
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      throw new Error("Clerk user has no associated email address");
    }

    const fullName = [clerkUser.firstName, clerkUser.lastName]
      .filter(Boolean)
      .join(" ");

    dbUser = await db.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: {
        clerkId: userId,
        email: email,
        name: fullName || null,
        imageUrl: clerkUser.imageUrl || null,
      },
    });
  }

  return dbUser;
}

export async function getAuthenticatedUser() {
  const { userId } = await auth();
  if (!userId) return null;

  let dbUser = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!dbUser) {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) return null;

    const fullName = [clerkUser.firstName, clerkUser.lastName]
      .filter(Boolean)
      .join(" ");

    dbUser = await db.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: {
        clerkId: userId,
        email: email,
        name: fullName || null,
        imageUrl: clerkUser.imageUrl || null,
      },
    });
  }

  return dbUser;
}
