import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

const dayRange = (date: string) => {
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(`${date}T23:59:59.999`);
  const recordDate = new Date(`${date}T12:00:00`);

  if ([start, end, recordDate].some((value) => Number.isNaN(value.getTime()))) {
    return null;
  }

  return { start, end, recordDate };
};

export const POST = async (req: Request) => {
  const currentUser = await getCurrentUser();

  if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "teacher")) {
    return NextResponse.json(
      { message: "No tienes permiso para registrar asistencia." },
      { status: 403 }
    );
  }

  const { userId, userType, date, present } = await req.json();
  const range = dayRange(String(date || ""));

  if (
    typeof userId !== "string" ||
    !["student", "teacher"].includes(userType) ||
    typeof present !== "boolean" ||
    !range
  ) {
    return NextResponse.json({ message: "Datos invalidos." }, { status: 400 });
  }

  if (userType === "teacher") {
    if (currentUser.role !== "admin") {
      return NextResponse.json(
        { message: "Solo el admin puede registrar asistencia de lideres." },
        { status: 403 }
      );
    }

    const existing = await prisma.liderAttendance.findFirst({
      where: { liderId: userId, date: { gte: range.start, lte: range.end } },
    });
    const record = existing
      ? await prisma.liderAttendance.update({
          where: { id: existing.id },
          data: { present, date: range.recordDate },
        })
      : await prisma.liderAttendance.create({
          data: { liderId: userId, present, date: range.recordDate },
        });

    return NextResponse.json(record);
  }

  if (currentUser.role === "teacher") {
    const student = await prisma.muchacho.findFirst({
      where: {
        id: userId,
        OR: [
          { class: { supervisorId: currentUser.id } },
          { class: { lessons: { some: { teacherId: currentUser.id } } } },
        ],
      },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json(
        { message: "Solo puedes registrar asistencia de muchachos de tu grupo." },
        { status: 403 }
      );
    }
  }

  const existing = await prisma.attendance.findFirst({
    where: { studentId: userId, date: { gte: range.start, lte: range.end } },
  });
  const record = existing
    ? await prisma.attendance.update({
        where: { id: existing.id },
        data: { present, date: range.recordDate },
      })
    : await prisma.attendance.create({
        data: { studentId: userId, present, date: range.recordDate },
      });

  return NextResponse.json(record);
};
