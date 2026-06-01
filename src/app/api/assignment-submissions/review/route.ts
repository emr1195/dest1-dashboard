import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
  const currentUser = await getCurrentUser();

  if (!currentUser || (currentUser.role !== "teacher" && currentUser.role !== "admin")) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { submissionId, score } = await request.json();
  const numericScore = Number(score);

  if (typeof submissionId !== "string" || !Number.isInteger(numericScore)) {
    return NextResponse.json({ message: "Datos invalidos." }, { status: 400 });
  }

  const submission = await prisma.assignmentSubmission.findFirst({
    where: {
      id: submissionId,
      ...(currentUser.role === "teacher"
        ? { assignment: { lesson: { teacherId: currentUser.id } } }
        : {}),
    },
    include: { assignment: true },
  });

  if (!submission) {
    return NextResponse.json({ message: "Respuesta no encontrada." }, { status: 404 });
  }

  if (numericScore < 0 || numericScore > submission.assignment.points) {
    return NextResponse.json(
      { message: `La puntuacion debe estar entre 0 y ${submission.assignment.points}.` },
      { status: 400 }
    );
  }

  const existing = await prisma.result.findFirst({
    where: {
      assignmentId: submission.assignmentId,
      studentId: submission.studentId,
      examId: null,
    },
  });

  const result = existing
    ? await prisma.result.update({
        where: { id: existing.id },
        data: { score: numericScore },
      })
    : await prisma.result.create({
        data: {
          score: numericScore,
          assignmentId: submission.assignmentId,
          studentId: submission.studentId,
          examId: null,
        },
      });

  return NextResponse.json({ ok: true, result });
};
