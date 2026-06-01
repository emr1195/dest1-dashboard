import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";

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
  const safeName = file.name.replace(/[^\w.\- ]/g, "").trim() || `respuesta${extension}`;
  const fileName = `tarea-${assignmentId}-${currentUser.id}-${randomUUID()}${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "assignments");
  const filePath = `/uploads/assignments/${fileName}`;

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()));

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
