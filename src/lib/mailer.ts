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

export const sendAccessCodeRequestEmail = async ({
  requesterEmail,
  requesterName,
  requesterAge,
  requesterPhone,
  requesterGender,
  guardianName,
  childrenNames,
  requesterRank,
  requesterLeaderGroup,
  roleLabel,
  code,
}: {
  requesterEmail: string;
  requesterName?: string;
  requesterAge?: string;
  requesterPhone?: string;
  requesterGender?: string;
  guardianName?: string;
  childrenNames?: string;
  requesterRank?: string;
  requesterLeaderGroup?: string;
  roleLabel: string;
  code: string;
}) => {
  const config = smtpConfig();

  if (!config) {
    console.warn("SMTP is not configured. Access code generated:", {
      requesterEmail,
      requesterName,
      requesterAge,
      requesterPhone,
      requesterGender,
      guardianName,
      childrenNames,
      requesterRank,
      requesterLeaderGroup,
      roleLabel,
      code,
    });
    return { sent: false };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  const lines = [
    "Nueva solicitud de codigo de acceso.",
    "Nombre: " + (requesterName || "No indicado"),
    "Edad: " + (requesterAge || "No indicada"),
    "Telefono: " + (requesterPhone || "No indicado"),
    "Genero: " + (requesterGender || "No indicado"),
    guardianName ? "Padre o madre: " + guardianName : "",
    childrenNames ? "Hijos: " + childrenNames : "",
    requesterRank ? "Rango: " + requesterRank : "",
    requesterLeaderGroup ? "Grupo que atiende: " + requesterLeaderGroup : "",
    "Correo: " + requesterEmail,
    "Tipo de cuenta: " + roleLabel,
    "Codigo para enviar: " + code,
    "El codigo vence en 24 horas.",
  ].filter(Boolean);

  await transporter.sendMail({
    from: config.from,
    to: config.to,
    subject: "Solicitud de codigo " + roleLabel,
    text: lines.join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
        <h2>Solicitud de codigo de acceso</h2>
        <p>Se solicito un codigo para crear una cuenta en el sistema.</p>
        <table style="border-collapse:collapse;width:100%;max-width:640px">
          ${lines
            .slice(1)
            .map((line) => {
              const [label, ...value] = line.split(": ");
              return `<tr><td style="border:1px solid #e5e7eb;padding:8px;font-weight:bold">${label}</td><td style="border:1px solid #e5e7eb;padding:8px">${value.join(": ")}</td></tr>`;
            })
            .join("")}
        </table>
      </div>
    `,
  });

  return { sent: true };
};
