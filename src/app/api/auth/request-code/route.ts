import { generateAccessCode, isAppRole, isValidLeaderGroup, isValidRankForRole, leaderGroupOptions, roleLabels } from "@/lib/roles";
import { sendAccessCodeRequestEmail } from "@/lib/mailer";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, name, age, phone, guardianName, childrenNames, rank, leaderGroup, gender, role } = await req.json();
  const normalizedEmail = String(email || "").toLowerCase().trim();
  const displayName = String(name || "").trim();
  const ageText = String(age || "").trim();
  const phoneText = String(phone || "").trim();
  const guardian = String(guardianName || "").trim();
  const children = String(childrenNames || "").trim();
  const selectedRank = String(rank || "").trim();
  const selectedLeaderGroup = String(leaderGroup || "").trim();
  const selectedGender = String(gender || "").trim();

  if (!normalizedEmail || !isAppRole(role)) {
    return NextResponse.json({ message: "Correo y tipo de cuenta son requeridos." }, { status: 400 });
  }

  if (!ageText || !phoneText) {
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

  const code = generateAccessCode(role);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.accessCode.create({
    data: {
      email: normalizedEmail,
      role,
      code,
      expiresAt,
    },
  });

  const result = await sendAccessCodeRequestEmail({
    requesterEmail: normalizedEmail,
    requesterName: displayName,
    requesterAge: ageText,
    requesterPhone: phoneText,
    requesterGender: selectedGender === "MALE" ? "Masculino" : "Femenino",
    guardianName: role === "student" ? guardian : undefined,
    childrenNames: role === "parent" ? children : undefined,
    requesterRank: role === "teacher" || role === "student" ? selectedRank : undefined,
    requesterLeaderGroup:
      role === "teacher" && selectedRank === "Lider de Grupo"
        ? leaderGroupOptions.find((group) => group.value === selectedLeaderGroup)?.label
        : undefined,
    roleLabel: roleLabels[role],
    code,
  });

  return NextResponse.json({
    ok: true,
    message: result.sent
      ? "Solicitud enviada. Espera el codigo por correo."
      : "Codigo generado. Configura SMTP para que llegue a tu correo.",
  });
}
