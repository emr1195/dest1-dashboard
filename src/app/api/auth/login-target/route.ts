import { verifyPassword } from "@/lib/password";
import prisma from "@/lib/prisma";
import { isAppRole, roleOptions } from "@/lib/roles";
import { NextResponse } from "next/server";

const adminEmails = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const dashboardPaths = Object.fromEntries(
  roleOptions.map((role) => [role.value, role.dashboardPath])
);

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const normalizedEmail = String(email || "").toLowerCase().trim();
  const plainPassword = String(password || "");

  if (!normalizedEmail || !plainPassword) {
    return NextResponse.json({ message: "Correo y contrasena son requeridos." }, { status: 400 });
  }

  const authUser = await prisma.authUser.findUnique({ where: { email: normalizedEmail } });

  if (!authUser?.passwordHash || !verifyPassword(plainPassword, authUser.passwordHash)) {
    return NextResponse.json({ message: "Correo o contrasena incorrectos." }, { status: 401 });
  }

  const role = adminEmails.includes(normalizedEmail) ? "admin" : authUser.role;

  if (!isAppRole(role)) {
    return NextResponse.json({ message: "La cuenta no tiene un rol valido." }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    role,
    dashboardPath: dashboardPaths[role],
  });
}
