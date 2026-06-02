export type AppRole = "admin" | "teacher" | "student" | "parent";

export const roleOptions: { value: AppRole; label: string; codePrefix: string; dashboardPath: string }[] = [
  { value: "admin", label: "Admin", codePrefix: "a", dashboardPath: "/admin" },
  { value: "teacher", label: "Lider", codePrefix: "l", dashboardPath: "/teacher" },
  { value: "student", label: "Joven", codePrefix: "j", dashboardPath: "/student" },
  { value: "parent", label: "Padre", codePrefix: "p", dashboardPath: "/parent" },
];

export const roleLabels = Object.fromEntries(roleOptions.map((role) => [role.value, role.label])) as Record<AppRole, string>;
export const rolePrefixes = Object.fromEntries(roleOptions.map((role) => [role.value, role.codePrefix])) as Record<AppRole, string>;

export type RankOption = { label: string; image: string };
export type LeaderGroupOption = { label: string; value: string; image: string };

export const rankOptionsByRole: Partial<Record<AppRole, RankOption[]>> = {
  teacher: [
    { label: "Coordinador de Destacamento", image: "/rangos/cmd mayor.png" },
    { label: "Coordinador Asistente de Destacamento", image: "/rangos/2do cmd mayor.png" },
    { label: "Lider de Grupo", image: "/rangos/cmd.png" },
    { label: "Lider Asistente de Grupo", image: "/rangos/2do cmd.png" },
    { label: "Capellan", image: "/rangos/capellan.png" },
  ],
  student: [
    { label: "Guia Mayor", image: "/rangos/guia mayor.png" },
    { label: "Guia Mayor Auxiliar", image: "/rangos/guia mayor aux.png" },
    { label: "Guia", image: "/rangos/guia.png" },
    { label: "Guia Auxiliar", image: "/rangos/guia aux.png" },
    { label: "Historiador", image: "/rangos/Historiador.png" },
    { label: "Supervisor de Equipo", image: "/rangos/sup equipo.png" },
    { label: "Lider Juvenil de Grupo", image: "/rangos/cmd jr.png" },
    { label: "Especialista en Comunicaciones", image: "/rangos/esp comunicaciones.png" },
  ],
};

export const isAppRole = (role: unknown): role is AppRole =>
  typeof role === "string" && roleOptions.some((option) => option.value === role);

export const isValidRankForRole = (role: AppRole, rank: unknown) => {
  const options = rankOptionsByRole[role];
  const value = String(rank || "").trim();

  return options ? options.some((option) => option.label === value) : value === "";
};

export const getRankOption = (role: "teacher" | "student", rank?: string | null) =>
  rankOptionsByRole[role]?.find((option) => option.label === rank) || null;

export const leaderGroupOptions: LeaderGroupOption[] = [
  { label: "Sin grupo", value: "sin-grupo", image: "/singleBranch.png" },
  { label: "Navegantes", value: "navegantes", image: "/navegantes-card.png" },
  { label: "Pioneros", value: "pioneros", image: "/pioneros-card.png" },
  { label: "Seguidores", value: "seguidores", image: "/seguidores-card.png" },
  { label: "Exploradores", value: "exploradores", image: "/exploradores-card.png" },
];

export const isValidLeaderGroup = (group: unknown) => {
  const value = String(group || "").trim();
  return leaderGroupOptions.some((option) => option.value === value);
};

export const normalizeAccessCode = (code: unknown) => String(code || "").trim().toLowerCase();

export const isValidCodeShape = (role: AppRole, code: string) => {
  const prefix = rolePrefixes[role];
  return new RegExp("^" + prefix + "\\d{5}$").test(code);
};

export const generateAccessCode = (role: AppRole) => {
  const number = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
  return rolePrefixes[role] + number;
};

