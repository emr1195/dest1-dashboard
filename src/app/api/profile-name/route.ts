import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const normalizeName = (value: unknown) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

export const PATCH = async (req: Request) => {
  const currentUser = await getCurrentUser();

  if (currentUser?.role !== "admin") {
    return NextResponse.json({ message: "Solo el admin puede editar nombres." }, { status: 403 });
  }

  const { id, type, name, surname } = await req.json();
  const normalizedName = normalizeName(name);
  const normalizedSurname = normalizeName(surname);

  if (
    typeof id !== "string" ||
    !["teacher", "student", "parent"].includes(type) ||
    !normalizedName ||
    !normalizedSurname ||
    normalizedName.length > 80 ||
    normalizedSurname.length > 80
  ) {
    return NextResponse.json({ message: "Datos invalidos." }, { status: 400 });
  }

  const profile =
    type === "student"
      ? await prisma.muchacho.update({
          where: { id },
          data: { name: normalizedName, surname: normalizedSurname },
          select: { email: true, name: true, surname: true },
        })
      : type === "teacher"
        ? await prisma.lider.update({
            where: { id },
            data: { name: normalizedName, surname: normalizedSurname },
            select: { email: true, name: true, surname: true },
          })
        : await prisma.parent.update({
            where: { id },
            data: { name: normalizedName, surname: normalizedSurname },
            select: { email: true, name: true, surname: true },
          });

  await prisma.authUser.updateMany({
    where: {
      role: type,
      OR: [{ id }, ...(profile.email ? [{ email: profile.email.toLowerCase() }] : [])],
    },
    data: { name: `${profile.name} ${profile.surname}` },
  });

  return NextResponse.json({ name: profile.name, surname: profile.surname });
};
