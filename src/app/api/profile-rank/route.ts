import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isValidRankForRole } from "@/lib/roles";
import { NextResponse } from "next/server";

export const PATCH = async (req: Request) => {
  const currentUser = await getCurrentUser();

  if (!currentUser?.id || !currentUser.role) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { id, type, rank } = await req.json();

  if (
    typeof id !== "string" ||
    (type !== "student" && type !== "teacher") ||
    typeof rank !== "string"
  ) {
    return NextResponse.json({ message: "Datos invalidos." }, { status: 400 });
  }

  if (currentUser.role !== "admin") {
    return NextResponse.json({ message: "Solo el admin puede cambiar rangos." }, { status: 403 });
  }

  const normalizedRank = rank.trim();

  if (normalizedRank && !isValidRankForRole(type, normalizedRank)) {
    return NextResponse.json({ message: "Rango invalido." }, { status: 400 });
  }

  const profile =
    type === "student"
      ? await prisma.muchacho.update({
          where: { id },
          data: { rank: normalizedRank || null },
          select: { email: true, rank: true },
        })
      : await prisma.lider.update({
          where: { id },
          data: { rank: normalizedRank || null },
          select: { email: true, rank: true },
        });

  await prisma.authUser.updateMany({
    where: {
      role: type,
      OR: [{ id }, ...(profile.email ? [{ email: profile.email }] : [])],
    },
    data: { rank: normalizedRank || null },
  });

  return NextResponse.json({ rank: profile.rank });
};
