import { getCurrentUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import prisma from "@/lib/prisma";
import {
  isValidLeaderGroup,
  isValidRankForRole,
  type AppRole,
} from "@/lib/roles";
import { UserSex } from "@prisma/client";
import { NextResponse } from "next/server";

type EditableProfileType = "teacher" | "student" | "parent";

const validTypes: EditableProfileType[] = ["teacher", "student", "parent"];

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

const normalizeEmail = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const isEditableType = (value: unknown): value is EditableProfileType =>
  typeof value === "string" &&
  validTypes.includes(value as EditableProfileType);

const roleForType = (type: EditableProfileType): AppRole => type;

const getProfile = async (id: string, type: EditableProfileType) => {
  if (type === "student") {
    return prisma.muchacho.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        surname: true,
        email: true,
        phone: true,
        address: true,
        birthday: true,
        sex: true,
        rank: true,
      },
    });
  }

  if (type === "teacher") {
    return prisma.lider.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        surname: true,
        email: true,
        phone: true,
        address: true,
        birthday: true,
        sex: true,
        rank: true,
      },
    });
  }

  return prisma.parent.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      name: true,
      surname: true,
      email: true,
      phone: true,
      address: true,
    },
  });
};

const requireAdmin = async () => {
  const currentUser = await getCurrentUser();
  return currentUser?.role === "admin";
};

export const GET = async (req: Request) => {
  if (!(await requireAdmin())) {
    return NextResponse.json(
      { message: "Solo el admin puede editar usuarios." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  const type = searchParams.get("type");

  if (!id || !isEditableType(type)) {
    return NextResponse.json({ message: "Datos invalidos." }, { status: 400 });
  }

  const profile = await getProfile(id, type);
  if (!profile) {
    return NextResponse.json(
      { message: "No se encontro el usuario." },
      { status: 404 }
    );
  }

  const authUser = await prisma.authUser.findFirst({
    where: {
      OR: [
        { id },
        ...(profile.email
          ? [{ email: profile.email.toLowerCase() }]
          : []),
      ],
    },
  });

  const profileWithOptionalFields = profile as typeof profile & {
    birthday?: Date;
    sex?: UserSex;
    rank?: string | null;
  };

  const birthday =
    authUser?.birthday || profileWithOptionalFields.birthday || null;

  return NextResponse.json({
    id,
    type,
    username: profile.username,
    name: profile.name,
    surname: profile.surname,
    email: profile.email || authUser?.email || "",
    phone: profile.phone || authUser?.phone || "",
    address: profile.address || authUser?.address || "",
    birthday: birthday ? birthday.toISOString().slice(0, 10) : "",
    sex:
      authUser?.sex ||
      profileWithOptionalFields.sex ||
      UserSex.UNSPECIFIED,
    rank: authUser?.rank || profileWithOptionalFields.rank || "",
    group: authUser?.leaderGroup || "",
    guardianName: authUser?.guardianName || "",
    childrenNames: authUser?.childrenNames || "",
  });
};

export const PATCH = async (req: Request) => {
  if (!(await requireAdmin())) {
    return NextResponse.json(
      { message: "Solo el admin puede editar usuarios." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const id = normalizeText(body.id);
  const type = body.type;
  const username = normalizeText(body.username).toLowerCase();
  const name = normalizeText(body.name);
  const surname = normalizeText(body.surname);
  const email = normalizeEmail(body.email);
  const phone = normalizeText(body.phone);
  const address = normalizeText(body.address);
  const birthdayValue = normalizeText(body.birthday);
  const sex = normalizeText(body.sex) as UserSex;
  const rank = normalizeText(body.rank);
  const group = normalizeText(body.group);
  const guardianName = normalizeText(body.guardianName);
  const childrenNames = normalizeText(body.childrenNames);
  const password = String(body.password || "");

  if (
    !id ||
    !isEditableType(type) ||
    !username ||
    !name ||
    !surname ||
    !email ||
    !birthdayValue ||
    !Object.values(UserSex).includes(sex) ||
    username.length > 60 ||
    name.length > 80 ||
    surname.length > 80 ||
    email.length > 160 ||
    phone.length > 40 ||
    address.length > 200 ||
    (password && password.length < 6)
  ) {
    return NextResponse.json({ message: "Datos invalidos." }, { status: 400 });
  }

  const birthday = new Date(`${birthdayValue}T12:00:00.000Z`);
  if (Number.isNaN(birthday.getTime())) {
    return NextResponse.json(
      { message: "La fecha de nacimiento no es valida." },
      { status: 400 }
    );
  }

  const role = roleForType(type);
  if (
    (type === "teacher" || type === "student") &&
    rank &&
    !isValidRankForRole(role, rank)
  ) {
    return NextResponse.json({ message: "El rango no es valido." }, { status: 400 });
  }

  if (
    (type === "teacher" || type === "student") &&
    group &&
    !isValidLeaderGroup(group)
  ) {
    return NextResponse.json({ message: "El grupo no es valido." }, { status: 400 });
  }

  const profile = await getProfile(id, type);
  if (!profile) {
    return NextResponse.json(
      { message: "No se encontro el usuario." },
      { status: 404 }
    );
  }

  const [studentUsername, leaderUsername, parentUsername, adminUsername] =
    await Promise.all([
      prisma.muchacho.findFirst({
        where: {
          id: { not: id },
          username: { equals: username, mode: "insensitive" },
        },
        select: { id: true },
      }),
      prisma.lider.findFirst({
        where: {
          id: { not: id },
          username: { equals: username, mode: "insensitive" },
        },
        select: { id: true },
      }),
      prisma.parent.findFirst({
        where: {
          id: { not: id },
          username: { equals: username, mode: "insensitive" },
        },
        select: { id: true },
      }),
      prisma.admin.findFirst({
        where: {
          id: { not: id },
          username: { equals: username, mode: "insensitive" },
        },
        select: { id: true },
      }),
    ]);

  if (studentUsername || leaderUsername || parentUsername || adminUsername) {
    return NextResponse.json(
      { message: "Ese nombre de usuario ya esta en uso." },
      { status: 409 }
    );
  }

  const [authEmail, studentEmail, leaderEmail, parentEmail] = await Promise.all([
    prisma.authUser.findFirst({
      where: {
        id: { not: id },
        email: { equals: email, mode: "insensitive" },
      },
      select: { id: true },
    }),
    prisma.muchacho.findFirst({
      where: {
        id: { not: id },
        email: { equals: email, mode: "insensitive" },
      },
      select: { id: true },
    }),
    prisma.lider.findFirst({
      where: {
        id: { not: id },
        email: { equals: email, mode: "insensitive" },
      },
      select: { id: true },
    }),
    prisma.parent.findFirst({
      where: {
        id: { not: id },
        email: { equals: email, mode: "insensitive" },
      },
      select: { id: true },
    }),
  ]);

  if (authEmail || studentEmail || leaderEmail || parentEmail) {
    return NextResponse.json(
      { message: "Ese correo ya esta en uso." },
      { status: 409 }
    );
  }

  await prisma.$transaction(async (tx) => {
    if (type === "student") {
      await tx.muchacho.update({
        where: { id },
        data: {
          username,
          name,
          surname,
          email,
          phone: phone || null,
          address,
          birthday,
          sex,
          rank: rank || null,
        },
      });
    } else if (type === "teacher") {
      await tx.lider.update({
        where: { id },
        data: {
          username,
          name,
          surname,
          email,
          phone: phone || null,
          address,
          birthday,
          sex,
          rank: rank || null,
        },
      });
    } else {
      await tx.parent.update({
        where: { id },
        data: {
          username,
          name,
          surname,
          email,
          phone,
          address,
        },
      });
    }

    const existingAuthUser = await tx.authUser.findFirst({
      where: {
        OR: [
          { id },
          ...(profile.email
            ? [{ email: profile.email.toLowerCase() }]
            : []),
        ],
      },
    });

    const authData = {
      email,
      name: `${name} ${surname}`,
      phone: phone || null,
      address,
      birthday,
      sex,
      rank:
        type === "teacher" || type === "student" ? rank || null : null,
      leaderGroup:
        type === "teacher" || type === "student" ? group || null : null,
      guardianName: type === "student" ? guardianName || null : null,
      childrenNames: type === "parent" ? childrenNames || null : null,
      role,
      ...(password ? { passwordHash: hashPassword(password) } : {}),
    };

    if (existingAuthUser) {
      await tx.authUser.update({
        where: { id: existingAuthUser.id },
        data: authData,
      });
    } else {
      await tx.authUser.create({
        data: {
          id,
          ...authData,
          provider: "credentials",
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
};
