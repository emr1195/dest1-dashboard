import nodemailer from "nodemailer";

const smtpReady = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.CODE_REQUEST_EMAIL);

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
  if (!smtpReady()) {
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
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.CODE_REQUEST_EMAIL,
    subject: "Solicitud de codigo " + roleLabel,
    text: [
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
    ].filter(Boolean).join("\n"),
  });

  return { sent: true };
};
