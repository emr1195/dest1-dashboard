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
  { number: "05", name: "Mateo" },
  { number: "06", name: "Romanos" },
  { number: "07", name: "1 Corintios" },
  { number: "08", name: "2 Corintios" },
  { number: "09", name: "Gálatas" },
  { number: "10", name: "Efesios" },
  { number: "11", name: "Filipenses" },
  { number: "12", name: "Colosenses" },
  { number: "13", name: "1 Tesalonicenses" },
  { number: "14", name: "2 Tesalonicenses" },
  { number: "15", name: "1 Timoteo" },
  { number: "16", name: "2 Timoteo" },
  { number: "17", name: "Tito" },
  { number: "18", name: "Filemón" },
  { number: "19", name: "Hebreos" },
  { number: "20", name: "Santiago" },
  { number: "21", name: "1 Pedro" },
  { number: "22", name: "1 Juan" },
  { number: "23", name: "2 Pedro" },
  { number: "24", name: "2 y 3 Juan - Judas" },
  { number: "25", name: "Apocalipsis" },
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

export const isSpiritualChallengeAwardId = (value?: string | null) =>
  Boolean(
    value &&
      biblicalAwardOptions.some(
        (award) =>
          award.value === value &&
          award.group === "exploradores" &&
          award.label.toLowerCase().startsWith("reto espiritual")
      )
  );

export const isBiblicalStudyAwardId = (value?: string | null) =>
  Boolean(
    value &&
      biblicalAwardOptions.some(
        (award) =>
          award.value === value && !isSpiritualChallengeAwardId(award.value)
      )
  );

export const getBiblicalAwardOptions = (group?: string) =>
  biblicalAwardOptions.filter(
    (award) =>
      !isSpiritualChallengeAwardId(award.value) &&
      (!group || group === "all" || award.group === group)
  );

export const getSpiritualChallengeAwardOptions = (group?: string) =>
  biblicalAwardOptions.filter(
    (award) =>
      isSpiritualChallengeAwardId(award.value) &&
      (!group || group === "all" || award.group === group)
  );
