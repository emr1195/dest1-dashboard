export type BiblicalAwardOption = {
  value: string;
  label: string;
  group: "pioneros" | "seguidores" | "exploradores";
};

export const biblicalBookOptions = [
  { number: "01", name: "Salmos" },
  { number: "02", name: "Proverbios" },
  { number: "03", name: "Isaías" },
  { number: "04", name: "Jeremías" },
  { number: "05", name: "Romanos" },
  { number: "06", name: "1 Corintios" },
  { number: "07", name: "2 Corintios" },
  { number: "08", name: "Gálatas" },
  { number: "09", name: "Efesios" },
  { number: "10", name: "Filipenses" },
  { number: "11", name: "Colosenses" },
  { number: "12", name: "1 Tesalonicenses" },
  { number: "13", name: "2 Tesalonicenses" },
  { number: "14", name: "1 Timoteo" },
  { number: "15", name: "2 Timoteo" },
  { number: "16", name: "Tito" },
  { number: "17", name: "Filemón" },
  { number: "18", name: "Hebreos" },
  { number: "19", name: "Santiago" },
  { number: "20", name: "1 Pedro" },
  { number: "21", name: "1 Juan" },
  { number: "22", name: "2 Pedro" },
  { number: "23", name: "2 y 3 Juan - Judas" },
  { number: "24", name: "Apocalipsis" },
] as const;

export const isBiblicalBookName = (value: string) =>
  biblicalBookOptions.some((book) => book.name === value);

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
