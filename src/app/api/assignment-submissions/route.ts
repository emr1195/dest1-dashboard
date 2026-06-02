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

  const formData = await request.formData();
  const assignmentId = Number(formData.get("assignmentId"));
  const file = formData.get("file");

  if (!assignmentId || !(file instanceof File)) {
    return NextResponse.json({ message: "Datos invalidos." }, { status: 400 });
  }

  if (currentUser.role !== "student") {
    return NextResponse.json(
      { message: "Solo los muchachos pueden subir respuestas." },
      { status: 403 }
    );
  }

  const assignment = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      lesson: {
        class: {
          students: {
            some: { id: currentUser.id },
          },
        },
      },
    },
    select: { id: true },
  });

  if (!assignment) {
    return NextResponse.json({ message: "Tarea no encontrada." }, { status: 404 });
  }

  const extension = path.extname(file.name) || ".dat";
  const safeName = sanitizeFileName(file.name, `respuesta${extension}`);
  const filePath = await fileToDataUrl(file);

  const submission = await prisma.assignmentSubmission.upsert({
    where: {
      assignmentId_studentId: {
        assignmentId,
        studentId: currentUser.id,
      },
    },
    create: {
      assignmentId,
      studentId: currentUser.id,
      fileName: safeName,
      filePath,
      fileType: file.type || null,
    },
    update: {
      fileName: safeName,
      filePath,
      fileType: file.type || null,
    },
  });

  return NextResponse.json(submission);
};
