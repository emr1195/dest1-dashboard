import nodemailer from "nodemailer";

const smtpConfig = () => {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const to = process.env.CODE_REQUEST_EMAIL?.trim();

  if (!host || !user || !pass || !to) return null;

  return {
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    user,
    pass,
    from: process.env.SMTP_FROM?.trim() || user,
    to,
  };
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const createTransport = () => {
  const config = smtpConfig();

  if (!config) return null;

  return {
    config,
    transporter: nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    }),
  };
};

export const sendAccessCodeRequestEmail = async ({
  requesterEmail,
  requesterName,
  requesterAge,
  requesterBirthDate,
  requesterPhone,
  requesterAddress,
  requesterGender,
  guardianName,
  childrenNames,
  requesterRank,
  requesterLeaderGroup,
  roleLabel,
  code,
  approveUrl,
  rejectUrl,
}: {
  requesterEmail: string;
  requesterName?: string;
  requesterAge?: string;
  requesterBirthDate?: string;
  requesterPhone?: string;
  requesterAddress?: string;
  requesterGender?: string;
  guardianName?: string;
  childrenNames?: string;
  requesterRank?: string;
  requesterLeaderGroup?: string;
  roleLabel: string;
  code: string;
  approveUrl: string;
  rejectUrl: string;
}) => {
  const mailer = createTransport();

  if (!mailer) {
    console.warn("SMTP is not configured. Access code generated:", {
      requesterEmail,
      requesterName,
      requesterAge,
      requesterBirthDate,
      requesterPhone,
      requesterAddress,
      requesterGender,
      guardianName,
      childrenNames,
      requesterRank,
      requesterLeaderGroup,
      roleLabel,
      code,
      approveUrl,
      rejectUrl,
    });
    return { sent: false };
  }

  const lines = [
    "Nueva solicitud de codigo de acceso.",
    "Revisa esta solicitud y selecciona Aprobar o Rechazar.",
    "Nombre: " + (requesterName || "No indicado"),
    "Fecha de nacimiento: " + (requesterBirthDate || "No indicada"),
    "Edad: " + (requesterAge || "No indicada"),
    "Telefono: " + (requesterPhone || "No indicado"),
    "Direccion: " + (requesterAddress || "No indicada"),
    "Genero: " + (requesterGender || "No indicado"),
    guardianName ? "Padre o madre: " + guardianName : "",
    childrenNames ? "Hijos: " + childrenNames : "",
    requesterRank ? "Rango: " + requesterRank : "",
    requesterLeaderGroup ? "Grupo que atiende: " + requesterLeaderGroup : "",
    "Correo: " + requesterEmail,
    "Tipo de cuenta: " + roleLabel,
    "Codigo reservado: " + code,
    "El codigo vence en 24 horas.",
    "Aprobar: " + approveUrl,
    "Rechazar: " + rejectUrl,
  ].filter(Boolean);

  await mailer.transporter.sendMail({
    from: mailer.config.from,
    to: mailer.config.to,
    subject: "Solicitud pendiente de codigo - " + roleLabel,
    text: lines.join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
        <h2>Solicitud pendiente de codigo de acceso</h2>
        <p>Se solicito un codigo para crear una cuenta en el sistema.</p>
        <p><strong>Selecciona una opcion para responder automaticamente al solicitante.</strong></p>
        <p style="margin:24px 0">
          <a href="${escapeHtml(approveUrl)}" style="display:inline-block;margin-right:12px;padding:12px 18px;border-radius:8px;background:#0f8a4b;color:#ffffff;text-decoration:none;font-weight:bold">Aprobar</a>
          <a href="${escapeHtml(rejectUrl)}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#c1121f;color:#ffffff;text-decoration:none;font-weight:bold">Rechazar</a>
        </p>
        <table style="border-collapse:collapse;width:100%;max-width:640px">
          ${lines
            .slice(1, -2)
            .map((line) => {
              const [label, ...value] = line.split(": ");
              return `<tr><td style="border:1px solid #e5e7eb;padding:8px;font-weight:bold">${escapeHtml(label)}</td><td style="border:1px solid #e5e7eb;padding:8px">${escapeHtml(value.join(": "))}</td></tr>`;
            })
            .join("")}
        </table>
      </div>
    `,
  });

  return { sent: true };
};

export const sendApprovedAccessCodeEmail = async ({
  requesterEmail,
  requesterName,
  roleLabel,
  code,
}: {
  requesterEmail: string;
  requesterName?: string | null;
  roleLabel: string;
  code: string;
}) => {
  const mailer = createTransport();

  if (!mailer) {
    console.warn("SMTP is not configured. Approved access code:", {
      requesterEmail,
      requesterName,
      roleLabel,
      code,
    });
    return { sent: false };
  }

  await mailer.transporter.sendMail({
    from: mailer.config.from,
    to: requesterEmail,
    subject: "Codigo aprobado para crear tu cuenta",
    text: [
      `Hola ${requesterName || ""}`.trim() + ",",
      "",
      "Tu solicitud fue aprobada.",
      "Tipo de cuenta: " + roleLabel,
      "Codigo de acceso: " + code,
      "",
      "El codigo vence en 24 horas desde que fue solicitado.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
        <h2>Tu codigo fue aprobado</h2>
        <p>Hola ${escapeHtml(requesterName || "")}, tu solicitud fue aprobada.</p>
        <p>Tipo de cuenta: <strong>${escapeHtml(roleLabel)}</strong></p>
        <p style="font-size:22px"><strong>${escapeHtml(code)}</strong></p>
        <p>Usa este codigo para terminar de crear tu cuenta. El codigo vence en 24 horas desde que fue solicitado.</p>
      </div>
    `,
  });

  return { sent: true };
};

export const sendRejectedAccessCodeEmail = async ({
  requesterEmail,
  requesterName,
  roleLabel,
}: {
  requesterEmail: string;
  requesterName?: string | null;
  roleLabel: string;
}) => {
  const mailer = createTransport();

  if (!mailer) {
    console.warn("SMTP is not configured. Rejected access code request:", {
      requesterEmail,
      requesterName,
      roleLabel,
    });
    return { sent: false };
  }

  await mailer.transporter.sendMail({
    from: mailer.config.from,
    to: requesterEmail,
    subject: "Solicitud de cuenta rechazada",
    text: [
      `Hola ${requesterName || ""}`.trim() + ",",
      "",
      "Tu solicitud para crear una cuenta fue rechazada.",
      "Tipo de cuenta: " + roleLabel,
      "Por favor comunicate con el administrador.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
        <h2>Solicitud rechazada</h2>
        <p>Hola ${escapeHtml(requesterName || "")}, tu solicitud para crear una cuenta fue rechazada.</p>
        <p>Tipo de cuenta: <strong>${escapeHtml(roleLabel)}</strong></p>
        <p>Por favor comunicate con el administrador.</p>
      </div>
    `,
  });

  return { sent: true };
};
