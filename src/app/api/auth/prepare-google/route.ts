import { isAppRole, normalizeAccessCode } from "@/lib/roles";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { role, code } = await req.json();

  if (!isAppRole(role)) {
    return NextResponse.json({ message: "Selecciona un tipo de cuenta valido." }, { status: 400 });
  }

  const normalizedCode = normalizeAccessCode(code);
  if (!normalizedCode) {
    return NextResponse.json({ message: "Ingresa el codigo de acceso." }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("pending_google_role", role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  response.cookies.set("pending_google_code", normalizedCode, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  return response;
}
