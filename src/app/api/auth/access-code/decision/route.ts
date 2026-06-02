import {
  sendApprovedAccessCodeEmail,
  sendRejectedAccessCodeEmail,
} from "@/lib/mailer";
import prisma from "@/lib/prisma";
import { roleLabels } from "@/lib/roles";
import { NextResponse } from "next/server";

const responsePage = (title: string, message: string, status = 200) =>
  new NextResponse(
    `<!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
        <style>
          body{margin:0;min-height:100vh;display:grid;place-items:center;background:#eef3f7;font-family:Arial,sans-serif;color:#111827}
          main{max-width:560px;margin:24px;padding:32px;border-radius:12px;background:white;box-shadow:0 18px 40px rgba(15,23,42,.12)}
          h1{margin:0 0 12px;font-size:28px}
          p{margin:0;line-height:1.55;color:#4b5563}
        </style>
      </head>
      <body>
        <main>
          <h1>${title}</h1>
          <p>${message}</p>
        </main>
      </body>
    </html>`,
    {
      status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token")?.trim();
  const action = url.searchParams.get("action")?.trim();

  if (!token || (action !== "approve" && action !== "reject")) {
    return responsePage(
      "Solicitud invalida",
      "El enlace no tiene la informacion necesaria para procesar esta solicitud.",
      400
    );
  }

  const accessCode = await prisma.accessCode.findUnique({
    where: { decisionToken: token },
  });

  if (!accessCode) {
    return responsePage(
      "Enlace no encontrado",
      "No se encontro una solicitud pendiente para este enlace.",
      404
    );
  }

  if (accessCode.used) {
    return responsePage(
      "Codigo ya utilizado",
      "Este codigo ya fue usado para crear una cuenta."
    );
  }

  if (accessCode.expiresAt <= new Date()) {
    await prisma.accessCode.update({
      where: { id: accessCode.id },
      data: { status: "expired", decidedAt: new Date() },
    });

    return responsePage(
      "Codigo vencido",
      "Esta solicitud ya vencio. El usuario debe solicitar un nuevo codigo.",
      410
    );
  }

  if (accessCode.status === "approved") {
    return responsePage(
      "Solicitud ya aprobada",
      "Este codigo ya fue aprobado y enviado al solicitante."
    );
  }

  if (accessCode.status === "rejected") {
    return responsePage(
      "Solicitud ya rechazada",
      "Esta solicitud ya fue rechazada anteriormente."
    );
  }

  const roleLabel =
    roleLabels[accessCode.role as keyof typeof roleLabels] || accessCode.role;

  if (action === "approve") {
    await prisma.accessCode.update({
      where: { id: accessCode.id },
      data: { status: "approved", decidedAt: new Date() },
    });

    await sendApprovedAccessCodeEmail({
      requesterEmail: accessCode.email,
      roleLabel,
      code: accessCode.code,
    });

    return responsePage(
      "Solicitud aprobada",
      "El codigo fue enviado automaticamente al correo del solicitante."
    );
  }

  await prisma.accessCode.update({
    where: { id: accessCode.id },
    data: { status: "rejected", decidedAt: new Date() },
  });

  await sendRejectedAccessCodeEmail({
    requesterEmail: accessCode.email,
    roleLabel,
  });

  return responsePage(
    "Solicitud rechazada",
    "El solicitante recibira un correo indicando que debe comunicarse con el administrador."
  );
}
