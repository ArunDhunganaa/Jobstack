"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";
import { resumeDataInclude } from "@/lib/types";

export async function getUserResumes() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  return prisma.resume.findMany({
    where: { userId },
    include: resumeDataInclude,
    orderBy: { updatedAt: "desc" },
  });
}

export async function deleteResume(resumeId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const resume = await prisma.resume.findUnique({
    where: { id: resumeId, userId },
  });

  if (!resume) {
    throw new Error("Resume not found");
  }

  // Delete photo if exists
  if (resume.photoUrl) {
    try {
      await del(resume.photoUrl);
    } catch (error) {
      console.error("Error deleting photo:", error);
    }
  }

  // Delete resume (cascade will delete work experiences and educations)
  await prisma.resume.delete({
    where: { id: resumeId },
  });

  return { success: true };
}
