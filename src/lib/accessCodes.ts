import prisma from "./prisma";
import { AppRole, isValidCodeShape, normalizeAccessCode } from "./roles";

export const verifyAccessCode = async ({
  email,
  role,
  code,
}: {
  email: string;
  role: AppRole;
  code: string;
}) => {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedCode = normalizeAccessCode(code);

  if (!isValidCodeShape(role, normalizedCode)) return null;

  const accessCode = await prisma.accessCode.findFirst({
    where: {
      email: normalizedEmail,
      role,
      code: normalizedCode,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  return accessCode;
};

export const consumeAccessCode = async (id: string) => {
  await prisma.accessCode.update({
    where: { id },
    data: { used: true, usedAt: new Date() },
  });
};
