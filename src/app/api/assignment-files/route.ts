import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

export const POST = async (request: Request) => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  if (currentUser.role !== "teacher" && currentUser.role !== "admin") {
    return NextResponse.json(
      { message: "Solo lideres y admin pueden subir documentos de tareas." },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const assignmentId = Number(formData.get("assignmentId"));
  const file = formData.get("file");

  if (!assignmentId || !(file instanceof File)) {
    return NextResponse.json({ message: "Datos invalidos." }, { status: 400 });
  }

  const assignment = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      ...(currentUser.role === "teacher"
        ? { lesson: { teacherId: currentUser.id } }
        : {}),
    },
    select: { id: true },
  });

  if (!assignment) {
    return NextResponse.json({ message: "Tarea no encontrada." }, { status: 404 });
  }

  const extension = path.extname(file.name) || ".dat";
  const safeName = file.name.replace(/[^\w.\- ]/g, "").trim() || `documento${extension}`;
  const fileName = `documento-${assignmentId}-${currentUser.id}-${randomUUID()}${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "assignment-files");
  const filePath = `/uploads/assignment-files/${fileName}`;

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()));

  const assignmentFile = await prisma.assignmentFile.create({
    data: {
      assignmentId,
      uploadedById: currentUser.id,
      fileName: safeName,
      filePath,
      fileType: file.type || null,
    },
  });

  return NextResponse.json(assignmentFile);
};
