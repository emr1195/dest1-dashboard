import { consumeAccessCode, verifyAccessCode } from "@/lib/accessCodes";
import { hashPassword } from "@/lib/password";
import prisma from "@/lib/prisma";
import { isAppRole, isValidLeaderGroup, isValidRankForRole, normalizeAccessCode } from "@/lib/roles";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password, name, age, phone, guardianName, childrenNames, rank, leaderGroup, gender, role, code } = await req.json();
  const normalizedEmail = String(email || "").toLowerCase().trim();
  const plainPassword = String(password || "");
  const displayName = String(name || "").trim();
  const ageNumber = Number(age);
  const phoneNumber = String(phone || "").trim();
  const guardian = String(guardianName || "").trim();
  const children = String(childrenNames || "").trim();
  const selectedRank = String(rank || "").trim();
  const selectedLeaderGroup = String(leaderGroup || "").trim();
  const selectedGender = String(gender || "").trim();
  const normalizedCode = normalizeAccessCode(code);

  if (!normalizedEmail || !plainPassword || !isAppRole(role)) {
    return NextResponse.json({ message: "Correo, contrasena y tipo de cuenta son requeridos." }, { status: 400 });
  }

  if (!Number.isInteger(ageNumber) || ageNumber < 1 || ageNumber > 120 || !phoneNumber) {
    return NextResponse.json({ message: "Edad y numero de telefono son requeridos." }, { status: 400 });
  }

  if (selectedGender !== "MALE" && selectedGender !== "FEMALE") {
    return NextResponse.json({ message: "Selecciona un genero valido." }, { status: 400 });
  }

  if (role === "student" && !guardian) {
    return NextResponse.json({ message: "El nombre del padre o madre es requerido para muchachos." }, { status: 400 });
  }

  if (role === "parent" && !children) {
    return NextResponse.json({ message: "Los nombres de los hijos son requeridos para padres." }, { status: 400 });
  }

  if (!isValidRankForRole(role, selectedRank)) {
    return NextResponse.json({ message: "Selecciona un rango valido para este tipo de cuenta." }, { status: 400 });
  }

  if (role === "teacher" && selectedRank === "Lider de Grupo" && !isValidLeaderGroup(selectedLeaderGroup)) {
    return NextResponse.json({ message: "Selecciona un grupo valido para el lider." }, { status: 400 });
  }

  if (plainPassword.length < 6) {
    return NextResponse.json({ message: "La contrasena debe tener al menos 6 caracteres." }, { status: 400 });
  }

  const accessCode = await verifyAccessCode({ email: normalizedEmail, role, code: normalizedCode });
  if (!accessCode) {
    return NextResponse.json({ message: "Codigo invalido, vencido o no asignado a este correo." }, { status: 403 });
  }

  const existingUser = await prisma.authUser.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    return NextResponse.json({ message: "Ya existe una cuenta con ese correo." }, { status: 409 });
  }

  await prisma.authUser.create({
    data: {
      email: normalizedEmail,
      name: displayName || normalizedEmail,
      age: ageNumber,
      phone: phoneNumber,
      guardianName: role === "student" ? guardian : null,
      childrenNames: role === "parent" ? children : null,
      rank: role === "teacher" || role === "student" ? selectedRank : null,
      leaderGroup: role === "teacher" && selectedRank === "Lider de Grupo" ? selectedLeaderGroup : null,
      sex: selectedGender,
      passwordHash: hashPassword(plainPassword),
      provider: "credentials",
      role,
    },
  });

  if (role === "student") {
    await prisma.muchacho.updateMany({
      where: { email: normalizedEmail },
      data: { rank: selectedRank, sex: selectedGender },
    });
  }

  if (role === "teacher") {
    await prisma.lider.updateMany({
      where: { email: normalizedEmail },
      data: { rank: selectedRank, sex: selectedGender },
    });
  }

  await consumeAccessCode(accessCode.id);

  return NextResponse.json({ ok: true });
}
