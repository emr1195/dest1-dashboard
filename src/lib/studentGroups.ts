import { getStudentGroupName } from "./badgeCatalog";
import prisma from "./prisma";

export const studentGroupValues = [
  "navegantes",
  "pioneros",
  "seguidores",
  "exploradores",
] as const;

export type StudentGroupValue = (typeof studentGroupValues)[number];

export const isStudentGroupValue = (
  value?: string | null
): value is StudentGroupValue =>
  studentGroupValues.includes(value as StudentGroupValue);

const groupValueByName: Record<string, StudentGroupValue> = {
  Navegantes: "navegantes",
  Pioneros: "pioneros",
  Seguidores: "seguidores",
  Exploradores: "exploradores",
};

const getStudentGroupByBirthday = (birthday: Date) =>
  groupValueByName[getStudentGroupName(birthday)] || null;

export const getStudentProfileGroup = async (student: {
  id: string;
  email?: string | null;
  birthday: Date;
}) => {
  const account = await prisma.authUser.findFirst({
    where: {
      role: "student",
      OR: [
        { id: student.id },
        ...(student.email
          ? [{ email: student.email.toLowerCase() }]
          : []),
      ],
    },
    select: { leaderGroup: true, birthday: true },
  });

  return isStudentGroupValue(account?.leaderGroup)
    ? account.leaderGroup
    : getStudentGroupByBirthday(account?.birthday || student.birthday);
};

export const getStudentProfileIdsForGroup = async (
  group: StudentGroupValue
) => {
  const students = await prisma.muchacho.findMany({
    select: { id: true, email: true, birthday: true },
  });

  if (!students.length) return [];

  const accounts = await prisma.authUser.findMany({
    where: {
      role: "student",
      OR: [
        { id: { in: students.map((student) => student.id) } },
        {
          email: {
            in: students.flatMap((student) =>
              student.email ? [student.email.toLowerCase()] : []
            ),
          },
        },
      ],
    },
    select: { id: true, email: true, leaderGroup: true, birthday: true },
  });

  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const accountByEmail = new Map(
    accounts.flatMap((account) =>
      account.email ? [[account.email.toLowerCase(), account] as const] : []
    )
  );

  return students
    .filter((student) => {
      const account =
        accountById.get(student.id) ||
        (student.email
          ? accountByEmail.get(student.email.toLowerCase())
          : undefined);
      const resolvedGroup = isStudentGroupValue(account?.leaderGroup)
        ? account.leaderGroup
        : getStudentGroupByBirthday(account?.birthday || student.birthday);

      return resolvedGroup === group;
    })
    .map((student) => student.id);
};

export const getStudentGroupFromReturnHref = (value?: string | null) => {
  if (!value) return null;

  try {
    const url = new URL(value, "https://assignment-navigation.local");
    const group = url.searchParams.get("group");
    return isStudentGroupValue(group) ? group : null;
  } catch {
    return null;
  }
};
