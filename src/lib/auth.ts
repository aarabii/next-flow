import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "./prisma";
import type { User } from "../../generated/prisma/client";

async function findOrCreateUser(clerkUserId: string): Promise<User | null> {
  // First, try to find the user by Clerk ID
  const existingUser = await db.user.findUnique({
    where: { clerkId: clerkUserId },
  });

  if (existingUser) return existingUser;

  const clerkUser = await currentUser();

  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) return null;

  const fullName = [clerkUser.firstName, clerkUser.lastName]
    .filter(Boolean)
    .join(" ");

  // Check whether this email already exists in the database
  const existingEmailUser = await db.user.findUnique({
    where: { email },
  });

  // If the email exists, link it to the current Clerk account
  if (existingEmailUser) {
    return db.user.update({
      where: { email },
      data: {
        clerkId: clerkUserId,
        name: fullName || existingEmailUser.name,
        imageUrl: clerkUser.imageUrl || existingEmailUser.imageUrl,
      },
    });
  }

  // Otherwise, create a completely new user
  return db.user.create({
    data: {
      clerkId: clerkUserId,
      email,
      name: fullName || null,
      imageUrl: clerkUser.imageUrl || null,
    },
  });
}

/**
 * Ensures user is authenticated and synced to the database.
 * Redirects to home page if not authenticated.
 */
export async function checkAndSyncUser(): Promise<User> {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const dbUser = await findOrCreateUser(userId);
  if (!dbUser) {
    redirect("/");
  }

  return dbUser;
}

/**
 * Returns the currently authenticated and synced user, or null if unauthenticated.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;

  return findOrCreateUser(userId);
}
