import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isValidLeaderGroup } from "@/lib/roles";
import { NextResponse } from "next/server";

export const PATCH = async (req: Request) => {
  const currentUser = await getCurrentUser();

  if (currentUser?.role !== "admin") {
    return NextResponse.json({ message: "Solo el admin puede cambiar grupos." }, { status: 403 });
  }

  const { id, type, group } = await req.json();

  if (
    typeof id !== "string" ||
    (type !== "student" && type !== "teacher") ||
    typeof group !== "string"
  ) {
    return NextResponse.json({ message: "Datos invalidos." }, { status: 400 });
  }

  const normalizedGroup = group.trim();

  if (normalizedGroup && !isValidLeaderGroup(normalizedGroup)) {
    return NextResponse.json({ message: "Grupo invalido." }, { status: 400 });
  }

  const profile =
    type === "student"
      ? await prisma.muchacho.findUnique({ where: { id }, select: { email: true } })
      : await prisma.lider.findUnique({ where: { id }, select: { email: true } });

  if (!profile) {
    return NextResponse.json({ message: "Perfil no encontrado." }, { status: 404 });
  }

  await prisma.authUser.updateMany({
    where: {
      role: type,
      OR: [{ id }, ...(profile.email ? [{ email: profile.email }] : [])],
    },
    data: { leaderGroup: normalizedGroup || null },
  });

  return NextResponse.json({ group: normalizedGroup || null });
};
