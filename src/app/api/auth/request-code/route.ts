import { generateAccessCode, isAppRole, isValidLeaderGroup, isValidRankForRole, leaderGroupOptions, roleLabels } from "@/lib/roles";
import { sendAccessCodeRequestEmail } from "@/lib/mailer";
import prisma from "@/lib/prisma";
import { getTodayDateKey } from "@/lib/timeZone";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

const parseBirthDate = (value: unknown) => {
  const raw = String(value || "").trim();
  const parts = raw.split("-").map(Number);

  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return null;

  const [year, month, day] = parts;
  const birthday = new Date(year, month - 1, day, 12, 0, 0, 0);

  if (
    birthday.getFullYear() !== year ||
    birthday.getMonth() !== month - 1 ||
    birthday.getDate() !== day
  ) {
    return null;
  }

  return birthday;
};

const getAgeFromBirthday = (birthday: Date) => {
  const [year, month, day] = getTodayDateKey().split("-").map(Number);
  const today = new Date(Date.UTC(year, month - 1, day, 12));
  let age = today.getUTCFullYear() - birthday.getUTCFullYear();
  const birthdayThisYear = new Date(
    Date.UTC(today.getUTCFullYear(), birthday.getUTCMonth(), birthday.getUTCDate(), 12)
  );

  if (today < birthdayThisYear) age -= 1;

  return age;
};

const normalizeAppUrl = (value?: string | null) => {
  const raw = value?.trim();

  if (!raw) return null;

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  return withProtocol.replace(/\/$/, "");
};

const getRequestOrigin = (req: Request) => {
  const configuredUrl =
    normalizeAppUrl(process.env.APP_URL) ||
    normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL) ||
    normalizeAppUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);

  if (configuredUrl) return configuredUrl;

  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost || req.headers.get("host");

  if (host) {
    const forwardedProto = req.headers.get("x-forwarded-proto");
    const proto =
      forwardedProto || (host.includes("localhost") ? "http" : "https");

    return `${proto}://${host}`.replace(/\/$/, "");
  }

  return (
    normalizeAppUrl(process.env.NEXTAUTH_URL) ||
    new URL(req.url).origin.replace(/\/$/, "")
  );
};

export async function POST(req: Request) {
  const { email, name, birthDate, phone, address, guardianName, childrenNames, rank, leaderGroup, gender, role } = await req.json();
  const appUrl = getRequestOrigin(req);
  const normalizedEmail = String(email || "").toLowerCase().trim();
  const displayName = String(name || "").trim();
  const birthday = parseBirthDate(birthDate);
  const ageNumber = birthday ? getAgeFromBirthday(birthday) : NaN;
  const ageText = Number.isInteger(ageNumber) ? String(ageNumber) : "";
  const birthDateText = String(birthDate || "").trim();
  const phoneText = String(phone || "").trim();
  const addressText = String(address || "").trim();
  const guardian = String(guardianName || "").trim();
  const children = String(childrenNames || "").trim();
  const selectedRank = String(rank || "").trim();
  const selectedLeaderGroup = String(leaderGroup || "").trim();
  const selectedGender = String(gender || "").trim();

  if (!normalizedEmail || !isAppRole(role)) {
    return NextResponse.json({ message: "Correo y tipo de cuenta son requeridos." }, { status: 400 });
  }

  if (!birthday || !Number.isInteger(ageNumber) || ageNumber < 1 || ageNumber > 120 || !phoneText || !addressText) {
    return NextResponse.json(
      { message: "Fecha de nacimiento, numero de telefono y direccion son requeridos." },
      { status: 400 }
    );
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

  if (role === "teacher" && !isValidLeaderGroup(selectedLeaderGroup)) {
    return NextResponse.json({ message: "Selecciona un grupo valido para el lider." }, { status: 400 });
  }

  const code = generateAccessCode(role);
  const decisionToken = randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.accessCode.deleteMany({
    where: {
      email: normalizedEmail,
      role,
      used: false,
    },
  });

  await prisma.accessCode.create({
    data: {
      email: normalizedEmail,
      role,
      code,
      status: "pending",
      decisionToken,
      expiresAt,
    },
  });

  const decisionBase = `${appUrl.replace(/\/$/, "")}/api/auth/access-code/decision`;
  const approveUrl = `${decisionBase}?token=${decisionToken}&action=approve`;
  const rejectUrl = `${decisionBase}?token=${decisionToken}&action=reject`;

  try {
    const result = await sendAccessCodeRequestEmail({
      requesterEmail: normalizedEmail,
      requesterName: displayName,
      requesterAge: ageText,
      requesterBirthDate: birthDateText,
      requesterPhone: phoneText,
      requesterAddress: addressText,
      requesterGender: selectedGender === "MALE" ? "Masculino" : "Femenino",
      guardianName: role === "student" ? guardian : undefined,
      childrenNames: role === "parent" ? children : undefined,
      requesterRank: role === "teacher" || role === "student" ? selectedRank : undefined,
      requesterLeaderGroup:
        role === "teacher"
          ? leaderGroupOptions.find((group) => group.value === selectedLeaderGroup)?.label
          : undefined,
      roleLabel: roleLabels[role],
      code,
      approveUrl,
      rejectUrl,
    });

    return NextResponse.json({
      ok: true,
      message: result.sent
        ? "Solicitud enviada. Espera la aprobacion del administrador."
        : "Solicitud registrada, pero falta configurar SMTP para enviarla al administrador.",
    });
  } catch (error) {
    console.error("No se pudo enviar el correo de codigo:", error);

    return NextResponse.json(
      {
        message:
          "Solicitud registrada, pero no se pudo enviar el correo. Revisa la configuracion SMTP.",
      },
      { status: 500 }
    );
  }
}
