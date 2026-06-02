import { Prisma, UserSex } from "@prisma/client";
import { consumeAccessCode, verifyAccessCode } from "@/lib/accessCodes";
import { hashPassword, verifyPassword } from "@/lib/password";
import prisma from "@/lib/prisma";
import { isAppRole, isValidLeaderGroup, isValidRankForRole, normalizeAccessCode, type AppRole } from "@/lib/roles";
import { NextResponse } from "next/server";

const DEFAULT_ADDRESS = "Destacamento";
const DEFAULT_BLOOD_TYPE = "O+";

const splitName = (value: string, fallback: string) => {
  const source = value.trim() || fallback.split("@")[0] || "Usuario";
  const parts = source.split(/\s+/).filter(Boolean);

  return {
    name: parts[0] || "Usuario",
    surname: parts.slice(1).join(" ") || "Sin apellido",
  };
};

const birthdayFromAge = (age: number) => {
  const birthday = new Date();
  birthday.setFullYear(birthday.getFullYear() - age);
  birthday.setHours(12, 0, 0, 0);
  return birthday;
};

const getExistingProfileId = async (role: AppRole, email: string) => {
  if (role === "student") {
    const profile = await prisma.muchacho.findUnique({ where: { email }, select: { id: true } });
    return profile?.id;
  }

  if (role === "teacher") {
    const profile = await prisma.lider.findUnique({ where: { email }, select: { id: true } });
    return profile?.id;
  }

  if (role === "parent") {
    const profile = await prisma.parent.findUnique({ where: { email }, select: { id: true } });
    return profile?.id;
  }

  const admin = await prisma.admin.findFirst({ where: { username: email }, select: { id: true } });
  return admin?.id;
};

const getProfileIdByAuthId = async (role: AppRole, id: string) => {
  if (role === "student") {
    const profile = await prisma.muchacho.findUnique({ where: { id }, select: { id: true } });
    return profile?.id;
  }

  if (role === "teacher") {
    const profile = await prisma.lider.findUnique({ where: { id }, select: { id: true } });
    return profile?.id;
  }

  if (role === "parent") {
    const profile = await prisma.parent.findUnique({ where: { id }, select: { id: true } });
    return profile?.id;
  }

  const admin = await prisma.admin.findUnique({ where: { id }, select: { id: true } });
  return admin?.id;
};

const ensureGradeAndClass = async (tx: Prisma.TransactionClient) => {
  const grade =
    (await tx.grade.findFirst({ orderBy: { level: "asc" } })) ||
    (await tx.grade.create({ data: { level: 1 } }));

  const classItem =
    (await tx.class.findFirst()) ||
    (await tx.class.create({
      data: {
        name: "General",
        capacity: 100,
        gradeId: grade.id,
      },
    }));

  return { grade, classItem };
};

const ensureGuardianProfile = async (
  tx: Prisma.TransactionClient,
  authUserId: string,
  guardian: string
) => {
  const guardianParts = splitName(guardian, "Acudiente");
  const existingParent = await tx.parent.findFirst({
    where: {
      name: { equals: guardianParts.name, mode: "insensitive" },
      surname: { equals: guardianParts.surname, mode: "insensitive" },
    },
  });

  if (existingParent) return existingParent;

  return tx.parent.create({
    data: {
      id: `guardian-${authUserId}`,
      username: `guardian-${authUserId}`,
      name: guardianParts.name,
      surname: guardianParts.surname,
      phone: `guardian-${authUserId}`,
      address: DEFAULT_ADDRESS,
    },
  });
};

const syncRoleProfile = async ({
  tx,
  authUserId,
  role,
  normalizedEmail,
  displayName,
  ageNumber,
  phoneNumber,
  guardian,
  selectedRank,
  selectedGender,
  birthday,
}: {
  tx: Prisma.TransactionClient;
  authUserId: string;
  role: AppRole;
  normalizedEmail: string;
  displayName: string;
  ageNumber: number;
  phoneNumber: string;
  guardian: string;
  selectedRank: string;
  selectedGender: string;
  birthday: Date;
}) => {
  const personName = splitName(displayName, normalizedEmail);

  if (role === "admin") {
    await tx.admin.upsert({
      where: { id: authUserId },
      create: {
        id: authUserId,
        username: normalizedEmail,
      },
      update: {
        username: normalizedEmail,
      },
    });
  }

  if (role === "teacher") {
    await tx.lider.upsert({
      where: { id: authUserId },
      create: {
        id: authUserId,
        username: normalizedEmail,
        name: personName.name,
        surname: personName.surname,
        email: normalizedEmail,
        phone: phoneNumber,
        address: DEFAULT_ADDRESS,
        rank: selectedRank,
        bloodType: DEFAULT_BLOOD_TYPE,
        sex: selectedGender as UserSex,
        birthday,
      },
      update: {
        name: personName.name,
        surname: personName.surname,
        email: normalizedEmail,
        phone: phoneNumber,
        rank: selectedRank,
        sex: selectedGender as UserSex,
        birthday,
      },
    });
  }

  if (role === "student") {
    const { grade, classItem } = await ensureGradeAndClass(tx);
    const parent = await ensureGuardianProfile(tx, authUserId, guardian);

    await tx.muchacho.upsert({
      where: { id: authUserId },
      create: {
        id: authUserId,
        username: normalizedEmail,
        name: personName.name,
        surname: personName.surname,
        email: normalizedEmail,
        phone: phoneNumber,
        address: DEFAULT_ADDRESS,
        rank: selectedRank,
        bloodType: DEFAULT_BLOOD_TYPE,
        sex: selectedGender as UserSex,
        parentId: parent.id,
        classId: classItem.id,
        gradeId: grade.id,
        birthday,
      },
      update: {
        name: personName.name,
        surname: personName.surname,
        email: normalizedEmail,
        phone: phoneNumber,
        rank: selectedRank,
        sex: selectedGender as UserSex,
        parentId: parent.id,
        birthday,
      },
    });
  }

  if (role === "parent") {
    await tx.parent.upsert({
      where: { id: authUserId },
      create: {
        id: authUserId,
        username: normalizedEmail,
        name: personName.name,
        surname: personName.surname,
        email: normalizedEmail,
        phone: phoneNumber,
        address: DEFAULT_ADDRESS,
      },
      update: {
        name: personName.name,
        surname: personName.surname,
        email: normalizedEmail,
        phone: phoneNumber,
      },
    });
  }
};

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

  if (role === "teacher" && !isValidLeaderGroup(selectedLeaderGroup)) {
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

  const existingProfileId = await getExistingProfileId(role, normalizedEmail);
  const existingProfileByAuthId = existingUser ? await getProfileIdByAuthId(role, existingUser.id) : null;
  const birthday = birthdayFromAge(ageNumber);

  try {
    await prisma.$transaction(async (tx) => {
      if (existingUser) {
        const samePassword = existingUser.passwordHash
          ? verifyPassword(plainPassword, existingUser.passwordHash)
          : false;
        const missingRoleProfile = !existingProfileId && !existingProfileByAuthId;

        if (existingUser.role !== role || (!samePassword && !missingRoleProfile)) {
          throw new Error("EXISTING_USER_CONFLICT");
        }

        await tx.authUser.update({
          where: { id: existingUser.id },
          data: {
            name: displayName || normalizedEmail,
            age: ageNumber,
            phone: phoneNumber,
            guardianName: role === "student" ? guardian : null,
            childrenNames: role === "parent" ? children : null,
            rank: role === "teacher" || role === "student" ? selectedRank : null,
            leaderGroup: role === "teacher" ? selectedLeaderGroup : null,
            sex: selectedGender as UserSex,
            passwordHash: samePassword ? existingUser.passwordHash : hashPassword(plainPassword),
            provider: "credentials",
          },
        });

        await syncRoleProfile({
          tx,
          authUserId: existingUser.id,
          role,
          normalizedEmail,
          displayName,
          ageNumber,
          phoneNumber,
          guardian,
          selectedRank,
          selectedGender,
          birthday,
        });

        return;
      }

      const authUser = await tx.authUser.create({
        data: {
          ...(existingProfileId ? { id: existingProfileId } : {}),
          email: normalizedEmail,
          name: displayName || normalizedEmail,
          age: ageNumber,
          phone: phoneNumber,
          guardianName: role === "student" ? guardian : null,
          childrenNames: role === "parent" ? children : null,
          rank: role === "teacher" || role === "student" ? selectedRank : null,
          leaderGroup: role === "teacher" ? selectedLeaderGroup : null,
          sex: selectedGender as UserSex,
          passwordHash: hashPassword(plainPassword),
          provider: "credentials",
          role,
        },
      });

      await syncRoleProfile({
        tx,
        authUserId: authUser.id,
        role,
        normalizedEmail,
        displayName,
        ageNumber,
        phoneNumber,
        guardian,
        selectedRank,
        selectedGender,
        birthday,
      });
    });

    await consumeAccessCode(accessCode.id);
  } catch (error) {
    if (error instanceof Error && error.message === "EXISTING_USER_CONFLICT") {
      return NextResponse.json(
        { message: "Ya existe una cuenta con ese correo. Inicia sesion o usa otro correo." },
        { status: 409 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { message: "Ya existe una cuenta o perfil con ese correo, usuario o telefono." },
        { status: 409 }
      );
    }

    throw error;
  }

  return NextResponse.json({ ok: true });
}
