export type BadgeCourse = {
  id: string;
  src: string;
  alt: string;
};

export const leaderBadges: BadgeCourse[] = [
  { id: "fundamentos", src: "/fundamentos.png", alt: "Fundamentos" },
  { id: "mentores", src: "/mentores.png", alt: "Mentores" },
  { id: "cln", src: "/cln.png", alt: "CLN" },
  { id: "cnm", src: "/cnm.png", alt: "CNM" },
  { id: "ilj", src: "/ilj.png", alt: "ILJ" },
  { id: "cbd", src: "/cbd.png", alt: "CBD" },
  { id: "jb", src: "/jb.png", alt: "JB" },
  { id: "dcm", src: "/dcm.png", alt: "DCM" },
  { id: "aj", src: "/aj.png", alt: "AJ" },
  { id: "ava", src: "/ava.png", alt: "AVA" },
];

const toStudentBadge = (id: string): BadgeCourse => ({
  id,
  src: `/senda muchacho/${id}.png`,
  alt: id.toUpperCase(),
});

export const studentBadgesByGroup: Record<string, BadgeCourse[]> = {
  Navegantes: [],
  Pioneros: ["101", "102", "103", "104", "105", "106"].map(toStudentBadge),
  Seguidores: ["201", "202", "203", "204", "205", "206", "ilj", "cbd"].map(
    toStudentBadge
  ),
  Exploradores: ["301", "302", "303", "304", "305", "306", "ilj", "cbd"].map(
    toStudentBadge
  ),
};

export const getAge = (birthday: Date) => {
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const birthdayThisYear = new Date(
    today.getFullYear(),
    birthday.getMonth(),
    birthday.getDate()
  );

  if (today < birthdayThisYear) age -= 1;

  return age;
};

export const getStudentGroupName = (birthday: Date) => {
  const age = getAge(birthday);

  if (age >= 5 && age <= 7) return "Navegantes";
  if (age >= 8 && age <= 10) return "Pioneros";
  if (age >= 11 && age <= 14) return "Seguidores";
  if (age >= 15 && age <= 17) return "Exploradores";

  return "Sin grupo";
};

export const getBadgeCatalog = (
  userType: "student" | "teacher",
  studentGroup?: string
) =>
  userType === "student"
    ? studentBadgesByGroup[studentGroup || ""] || []
    : leaderBadges;
