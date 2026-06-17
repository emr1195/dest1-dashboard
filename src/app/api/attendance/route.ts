import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { dateKeyToUtcDate, getTodayDateKey } from "@/lib/timeZone";

const groupValues = ["navegantes", "pioneros", "seguidores", "exploradores"] as const;

type GroupValue = (typeof groupValues)[number];

const isGroupValue = (value?: string | null): value is GroupValue =>
  Boolean(value && groupValues.includes(value as GroupValue));

const getAge = (birthday: Date) => {
  const [year, month, day] = getTodayDateKey().split("-").map(Number);
  const today = new Date(Date.UTC(year, month - 1, day, 12));
  let age = today.getUTCFullYear() - birthday.getUTCFullYear();
  const birthdayThisYear = new Date(Date.UTC(today.getUTCFullYear(), birthday.getUTCMonth(), birthday.getUTCDate(), 12));
  if (today < birthdayThisYear) age -= 1;
  return age;
};

const getGroupValueByBirthday = (birthday: Date): GroupValue | null => {
  const age = getAge(birthday);

  if (age >= 5 && age <= 7) return "navegantes";
  if (age >= 8 && age <= 10) return "pioneros";
  if (age >= 11 && age <= 14) return "seguidores";
  if (age >= 15 && age <= 17) return "exploradores";

  return null;
};

const getResolvedStudentGroupValue = (
  student: { birthday: Date },
  account?: { leaderGroup: string | null; birthday?: Date | null } | null
) => {
  if (isGroupValue(account?.leaderGroup)) return account.leaderGroup;

  return getGroupValueByBirthday(account?.birthday || student.birthday);
};

const dayRange = (date: string) => {
  const start = dateKeyToUtcDate(date);
  const end = new Date(`${date}T23:59:59.999Z`);
  const recordDate = dateKeyToUtcDate(date, 12);

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
    const teacherProfile = await prisma.lider.findFirst({
      where: {
        OR: [
          { id: currentUser.id },
          ...(currentUser.email ? [{ email: currentUser.email.toLowerCase() }] : []),
        ],
      },
      select: { id: true, email: true },
    });
    const teacherAccount = await prisma.authUser.findFirst({
      where: {
        role: "teacher",
        OR: [
          { id: currentUser.id },
          ...(teacherProfile?.id ? [{ id: teacherProfile.id }] : []),
          ...(currentUser.email ? [{ email: currentUser.email.toLowerCase() }] : []),
          ...(teacherProfile?.email ? [{ email: teacherProfile.email.toLowerCase() }] : []),
        ],
      },
      select: { leaderGroup: true },
    });
    const studentProfile = await prisma.muchacho.findUnique({
      where: { id: userId },
      select: { id: true, email: true, birthday: true },
    });
    const studentAccount = studentProfile
      ? await prisma.authUser.findFirst({
          where: {
            role: "student",
            OR: [
              { id: studentProfile.id },
              ...(studentProfile.email ? [{ email: studentProfile.email.toLowerCase() }] : []),
            ],
          },
          select: { leaderGroup: true, birthday: true },
        })
      : null;
    const teacherGroup = isGroupValue(teacherAccount?.leaderGroup)
      ? teacherAccount.leaderGroup
      : null;
    const studentGroup = studentProfile
      ? getResolvedStudentGroupValue(studentProfile, studentAccount)
      : null;
    const groupAllowed = Boolean(teacherGroup && studentGroup === teacherGroup);
    const teacherIds = Array.from(
      new Set([currentUser.id, teacherProfile?.id].filter(Boolean))
    ) as string[];
    const classStudent = await prisma.muchacho.findFirst({
      where: {
        id: userId,
        OR: [
          { class: { supervisorId: { in: teacherIds } } },
          { class: { lessons: { some: { teacherId: { in: teacherIds } } } } },
        ],
      },
      select: { id: true },
    });

    if (!groupAllowed && !classStudent) {
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

export const DELETE = async (req: Request) => {
  const currentUser = await getCurrentUser();

  if (currentUser?.role !== "admin") {
    return NextResponse.json(
      { message: "Solo el admin puede eliminar asistencias." },
      { status: 403 }
    );
  }

  const { id, userType } = await req.json();
  const recordId = Number(id);

  if (
    !Number.isInteger(recordId) ||
    recordId <= 0 ||
    (userType !== "student" && userType !== "teacher")
  ) {
    return NextResponse.json({ message: "Datos invalidos." }, { status: 400 });
  }

  if (userType === "teacher") {
    await prisma.liderAttendance.delete({ where: { id: recordId } });
  } else {
    await prisma.attendance.delete({ where: { id: recordId } });
  }

  return NextResponse.json({ success: true });
};
