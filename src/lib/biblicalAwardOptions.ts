export type BiblicalAwardOption = {
  value: string;
  label: string;
  group: "pioneros" | "seguidores" | "exploradores";
};

const numberedAwards = (
  group: BiblicalAwardOption["group"],
  color: string,
  count: number
): BiblicalAwardOption[] =>
  Array.from({ length: count }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");

    return {
      value: `${group}-biblico-${number}`,
      label: `Premio biblico ${color} ${number}`,
      group,
    };
  });

const explorerNames = [
  "Reto espiritual azul",
  "Reto espiritual rojo",
  "Reto espiritual verde",
  "Reto espiritual bronce",
  "Reto espiritual plata",
  "Reto espiritual oro",
];

export const biblicalAwardOptions: BiblicalAwardOption[] = [
  ...numberedAwards("pioneros", "naranja", 15),
  ...numberedAwards("seguidores", "cafe", 15),
  ...explorerNames.map((label, index) => ({
    value: `exploradores-biblico-${String(index + 1).padStart(2, "0")}`,
    label,
    group: "exploradores" as const,
  })),
];

export const getBiblicalAwardOptions = (group?: string) =>
  group && group !== "all"
    ? biblicalAwardOptions.filter((award) => award.group === group)
    : biblicalAwardOptions;
