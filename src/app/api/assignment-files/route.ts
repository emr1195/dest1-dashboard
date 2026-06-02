import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { fileToDataUrl, sanitizeFileName } from "@/lib/uploadStorage";
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
  const safeName = sanitizeFileName(file.name, `documento${extension}`);
  const filePath = await fileToDataUrl(file);

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
