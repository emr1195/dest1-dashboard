import { getCurrentUser } from "@/lib/auth";
import { calculateEvaluationScore } from "@/lib/evaluationCriteria";
import {
  EvaluationUserType,
  getLatestEvaluation,
  isEvaluationDay,
  readEvaluations,
  writeEvaluations,
} from "@/lib/evaluations";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
  const currentUser = await getCurrentUser();

  if (!currentUser?.id || !currentUser.role) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode");

  if (mode === "users") {
    if (currentUser.role === "student") {
      const teachers = await prisma.lider.findMany({
        select: { id: true, name: true, surname: true },
        orderBy: [{ name: "asc" }, { surname: "asc" }],
      });

      return NextResponse.json({
        users: teachers.map((teacher) => ({ ...teacher, type: "teacher" })),
        evaluatorRole: currentUser.role,
        active: isEvaluationDay(),
      });
    }

    if (currentUser.role === "teacher") {
      const students = await prisma.muchacho.findMany({
        where: {
          OR: [
            { class: { supervisorId: currentUser.id } },
            { class: { lessons: { some: { teacherId: currentUser.id } } } },
          ],
        },
        select: { id: true, name: true, surname: true, img: true },
        orderBy: [{ name: "asc" }, { surname: "asc" }],
      });

      return NextResponse.json({
        users: students.map((student) => ({ ...student, type: "student" })),
        evaluatorRole: currentUser.role,
        active: isEvaluationDay(),
      });
    }

    if (currentUser.role === "admin") {
      const [teachers, students] = await Promise.all([
        prisma.lider.findMany({
          select: { id: true, name: true, surname: true },
          orderBy: [{ name: "asc" }, { surname: "asc" }],
        }),
        prisma.muchacho.findMany({
          select: { id: true, name: true, surname: true },
          orderBy: [{ name: "asc" }, { surname: "asc" }],
        }),
      ]);

      return NextResponse.json({
        users: [
          ...teachers.map((teacher) => ({ ...teacher, type: "teacher" })),
          ...students.map((student) => ({ ...student, type: "student" })),
        ],
        evaluatorRole: currentUser.role,
        active: true,
      });
    }
  }

  const userId = searchParams.get("userId");
  const userType = searchParams.get("userType") as EvaluationUserType | null;

  if (!userId || !userType || !["student", "teacher"].includes(userType)) {
    return NextResponse.json({ message: "Datos invalidos." }, { status: 400 });
  }

  const evaluation = await getLatestEvaluation(userId, userType);
  const score = evaluation?.score ?? 0;

  return NextResponse.json({
    score,
    score10: score * 10,
    updatedAt: evaluation?.createdAt ?? null,
  });
};

export const POST = async (req: Request) => {
  const currentUser = await getCurrentUser();

  if (!currentUser?.id || !currentUser.role) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  if (currentUser.role !== "admin" && !isEvaluationDay()) {
    return NextResponse.json(
      { message: "La evaluacion solo esta activa el primer dia de marzo, junio, septiembre y diciembre." },
      { status: 403 }
    );
  }

  const { userId, userType, aspectScores, notes } = await req.json();

  if (
    typeof userId !== "string" ||
    !["student", "teacher"].includes(userType) ||
    typeof aspectScores !== "object" ||
    aspectScores === null
  ) {
    return NextResponse.json({ message: "Datos invalidos." }, { status: 400 });
  }

  const canEvaluate =
    currentUser.role === "admin" ||
    (currentUser.role === "teacher" && userType === "student") ||
    (currentUser.role === "student" && userType === "teacher");

  if (!canEvaluate) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
  }

  if (currentUser.role === "teacher") {
    const assignedStudent = await prisma.muchacho.findFirst({
      where: {
        id: userId,
        OR: [
          { class: { supervisorId: currentUser.id } },
          { class: { lessons: { some: { teacherId: currentUser.id } } } },
        ],
      },
      select: { id: true },
    });

    if (!assignedStudent) {
      return NextResponse.json(
        { message: "Solo puedes evaluar muchachos de tu grupo." },
        { status: 403 }
      );
    }
  }

  const calculatedEvaluation = calculateEvaluationScore(userType, aspectScores);
  const records = await readEvaluations();
  const nextRecords = records.filter(
    (record) =>
      !(
        record.userId === userId &&
        record.userType === userType &&
        record.createdBy === currentUser.id
      )
  );

  const evaluation = {
    id: randomUUID(),
    userId,
    userType,
    score: calculatedEvaluation.score,
    aspectScores: calculatedEvaluation.aspectScores,
    notes: typeof notes === "string" ? notes : "",
    createdBy: currentUser.id,
    createdAt: new Date().toISOString(),
  };

  nextRecords.push(evaluation);
  await writeEvaluations(nextRecords);

  return NextResponse.json({
    score: evaluation.score,
    score10: evaluation.score * 10,
  });
};
