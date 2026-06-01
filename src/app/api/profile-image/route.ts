import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const POST = async (req: Request) => {
  const currentUser = await getCurrentUser();

  if (!currentUser?.id || !currentUser.role) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const formData = await req.formData();
  const id = formData.get("id");
  const type = formData.get("type");
  const file = formData.get("file");

  if (
    typeof id !== "string" ||
    typeof type !== "string" ||
    !(file instanceof File) ||
    !["student", "teacher"].includes(type)
  ) {
    return NextResponse.json({ message: "Datos invalidos." }, { status: 400 });
  }

  const canUpdate =
    currentUser.role === "admin" ||
    (currentUser.role === type && currentUser.id === id);

  if (!canUpdate) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ message: "El archivo debe ser una imagen." }, { status: 400 });
  }

  const extension = path.extname(file.name) || ".jpg";
  const fileName = `${type}-${id}-${randomUUID()}${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");
  const imagePath = `/uploads/profiles/${fileName}`;

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()));

  if (type === "student") {
    const user = await prisma.muchacho.update({
      where: { id },
      data: { img: imagePath },
      select: { img: true },
    });

    return NextResponse.json(user);
  }

  const user = await prisma.lider.update({
    where: { id },
    data: { img: imagePath },
    select: { img: true },
  });

  return NextResponse.json(user);
};
