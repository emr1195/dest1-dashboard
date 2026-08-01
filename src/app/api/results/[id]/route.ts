import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const PUT = async (request: Request, { params }: { params: { id: string } }) => {
  const currentUser = await getCurrentUser();
  if (!currentUser || !["admin", "teacher"].includes(currentUser.role)) return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  const id = Number(params.id);
  const { score } = await request.json();
  const numericScore = Number(score);
  if (!id || !Number.isInteger(numericScore) || numericScore < 0) return NextResponse.json({ message: "Puntaje inválido." }, { status: 400 });
  const result = await prisma.result.findFirst({ where: { id, ...(currentUser.role === "teacher" ? { OR: [{ assignment: { lesson: { teacherId: currentUser.id } } }, { exam: { lesson: { teacherId: currentUser.id } } }] } : {}) }, include: { assignment: { select: { points: true } } } });
  if (!result) return NextResponse.json({ message: "Resultado no encontrado." }, { status: 404 });
  if (result.assignment && numericScore > result.assignment.points) return NextResponse.json({ message: `El puntaje máximo es ${result.assignment.points}.` }, { status: 400 });
  const updated = await prisma.result.update({ where: { id }, data: { score: numericScore } });
  return NextResponse.json({ ok: true, result: updated });
};
