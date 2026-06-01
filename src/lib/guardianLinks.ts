import { Parent } from "@prisma/client";

import prisma from "@/lib/prisma";

export type GuardianLinkedStudent = {
  accountId: string;
  email: string;
  name: string;
  profileId: string | null;
  className: string | null;
};

const normalizeName = (value?: string | null) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export const getGuardianLinkedStudents = async (parents: Parent[]) => {
  const linkedByParentId = new Map<string, GuardianLinkedStudent[]>();
  parents.forEach((parent) => linkedByParentId.set(parent.id, []));

  if (!parents.length) return linkedByParentId;

  const parentAccounts = await prisma.authUser.findMany({
    where: {
      role: "parent",
      email: {
        in: parents.flatMap((parent) =>
          parent.email ? [parent.email.toLowerCase()] : []
        ),
      },
    },
    select: { email: true, name: true },
  });
  const parentNameByEmail = new Map(
    parentAccounts.map((account) => [
      account.email.toLowerCase(),
      normalizeName(account.name),
    ])
  );

  const studentAccounts = await prisma.authUser.findMany({
    where: { role: "student", guardianName: { not: null } },
    select: { id: true, email: true, name: true, guardianName: true },
  });
  const studentProfiles = await prisma.muchacho.findMany({
    where: {
      OR: [
        { id: { in: studentAccounts.map((student) => student.id) } },
        { email: { in: studentAccounts.map((student) => student.email) } },
      ],
    },
    include: { class: true },
  });
  const profileById = new Map(
    studentProfiles.map((student) => [student.id, student])
  );
  const profileByEmail = new Map(
    studentProfiles.flatMap((student) =>
      student.email ? [[student.email.toLowerCase(), student] as const] : []
    )
  );

  parents.forEach((parent) => {
    const parentName = parent.email
      ? parentNameByEmail.get(parent.email.toLowerCase())
      : undefined;

    if (!parentName) return;

    linkedByParentId.set(
      parent.id,
      studentAccounts
        .filter((student) => normalizeName(student.guardianName) === parentName)
        .map((student) => {
          const profile =
            profileById.get(student.id) ||
            profileByEmail.get(student.email.toLowerCase());

          return {
            accountId: student.id,
            email: student.email,
            name: student.name || student.email,
            profileId: profile?.id || null,
            className: profile?.class.name || null,
          };
        })
    );
  });

  return linkedByParentId;
};

export const getAccessibleStudentProfileIdsForParent = async (
  parentAccountId: string
) => {
  const parentAccount = await prisma.authUser.findUnique({
    where: { id: parentAccountId },
    select: { email: true },
  });
  const parent = await prisma.parent.findFirst({
    where: {
      OR: [
        { id: parentAccountId },
        ...(parentAccount?.email ? [{ email: parentAccount.email }] : []),
      ],
    },
  });

  if (!parent) return [];

  const directStudents = await prisma.muchacho.findMany({
    where: { parentId: parent.id },
    select: { id: true },
  });
  const registeredStudents =
    (await getGuardianLinkedStudents([parent])).get(parent.id) || [];

  return Array.from(
    new Set([
      ...directStudents.map((student) => student.id),
      ...registeredStudents.flatMap((student) =>
        student.profileId ? [student.profileId] : []
      ),
    ])
  );
};
