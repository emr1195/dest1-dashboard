import { getAge } from "@/lib/badgeCatalog";
import prisma from "@/lib/prisma";
import { getLeaderGroupOption } from "@/lib/roles";

const getAgeGroupName = (birthday: Date) => {
  const age = getAge(birthday);
  if (age >= 5 && age <= 7) return "Navegantes";
  if (age >= 8 && age <= 10) return "Pioneros";
  if (age >= 11 && age <= 14) return "Seguidores";
  if (age >= 15 && age <= 17) return "Exploradores";
  return "Sin grupo";
};

export const getGroupStudentCount = async (groupName: string) => {
  const [students, accounts] = await Promise.all([
    prisma.muchacho.findMany({ select: { id: true, email: true, birthday: true } }),
    prisma.authUser.findMany({
      where: { role: "student" },
      select: { id: true, email: true, leaderGroup: true },
    }),
  ]);
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const accountsByEmail = new Map(
    accounts.flatMap((account) => account.email ? [[account.email.toLowerCase(), account] as const] : [])
  );

  return students.filter((student) => {
    const account = accountsById.get(student.id) || (student.email ? accountsByEmail.get(student.email.toLowerCase()) : undefined);
    const savedGroup = getLeaderGroupOption(account?.leaderGroup)?.label;
    return (savedGroup || getAgeGroupName(student.birthday)) === groupName;
  }).length;
};
