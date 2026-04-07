import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "./db";
import type { Plan } from "@prisma/client";

const userSelect = {
  id: true,
  clerkId: true,
  email: true,
  plan: true,
  stripeCustomerId: true,
} as const;

export type AppUser = {
  id: string;
  clerkId: string;
  email: string | null;
  plan: Plan;
  stripeCustomerId: string | null;
};

export async function ensureAppUser(): Promise<AppUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const clerk = await currentUser();
  const email =
    clerk?.emailAddresses?.[0]?.emailAddress ??
    clerk?.primaryEmailAddress?.emailAddress ??
    null;

  const existing = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (existing) {
    if (email && existing.email !== email) {
      return prisma.user.update({
        where: { id: existing.id },
        data: { email },
        select: userSelect,
      });
    }
    return {
      id: existing.id,
      clerkId: existing.clerkId,
      email: existing.email,
      plan: existing.plan,
      stripeCustomerId: existing.stripeCustomerId,
    };
  }

  return prisma.user.create({
    data: {
      clerkId: userId,
      email,
    },
    select: userSelect,
  });
}
