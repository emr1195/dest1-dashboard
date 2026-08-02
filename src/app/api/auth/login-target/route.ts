import { findAuthUserByIdentifier } from "@/lib/credentialAccount";
import { verifyPassword } from "@/lib/password";
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
  const identifier = String(email || "").toLowerCase().trim();
  const plainPassword = String(password || "");

  if (!identifier || !plainPassword) {
    return NextResponse.json({ message: "El correo o usuario y la contraseña son obligatorios." }, { status: 400 });
  }

  const authUser = await findAuthUserByIdentifier(identifier);

  if (!authUser?.passwordHash || !verifyPassword(plainPassword, authUser.passwordHash)) {
    return NextResponse.json({ message: "El correo o la contraseña no son correctos." }, { status: 401 });
  }

  const role = adminEmails.includes(authUser.email.toLowerCase()) ? "admin" : authUser.role;

  if (!isAppRole(role)) {
    return NextResponse.json({ message: "La cuenta no tiene un rol válido." }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    role,
    dashboardPath: dashboardPaths[role],
  });
}
