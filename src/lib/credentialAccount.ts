import prisma from "./prisma";

export const findAuthUserByIdentifier = async (identifier: string) => {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  if (!normalizedIdentifier) return null;

  const accountByEmail = await prisma.authUser.findUnique({
    where: { email: normalizedIdentifier },
  });
  if (accountByEmail) return accountByEmail;

  const [leader, student, parent, admin] = await Promise.all([
    prisma.lider.findFirst({
      where: {
        username: { equals: normalizedIdentifier, mode: "insensitive" },
      },
      select: { id: true },
    }),
    prisma.muchacho.findFirst({
      where: {
        username: { equals: normalizedIdentifier, mode: "insensitive" },
      },
      select: { id: true },
    }),
    prisma.parent.findFirst({
      where: {
        username: { equals: normalizedIdentifier, mode: "insensitive" },
      },
      select: { id: true },
    }),
    prisma.admin.findFirst({
      where: {
        username: { equals: normalizedIdentifier, mode: "insensitive" },
      },
      select: { id: true },
    }),
  ]);

  const profileId = leader?.id || student?.id || parent?.id || admin?.id;
  if (!profileId) return null;

  return prisma.authUser.findUnique({ where: { id: profileId } });
};
