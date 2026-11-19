export type BiblicalAwardOption = {
  value: string;
  label: string;
  group: "pioneros" | "seguidores" | "exploradores";
};

export const pioneerBiblicalBookOptions = [
  { number: "01", name: "Génesis" },
  { number: "02", name: "Éxodo" },
  { number: "03", name: "Números" },
  { number: "04", name: "Deuteronomio" },
  { number: "05", name: "Josué" },
  { number: "06", name: "Jueces" },
  { number: "07", name: "Rut" },
  { number: "08", name: "1 Samuel" },
  { number: "09", name: "2 Samuel" },
  { number: "10", name: "1 Reyes" },
  { number: "11", name: "2 Reyes" },
  { number: "12", name: "1 Crónicas" },
  { number: "13", name: "2 Crónicas" },
  { number: "14", name: "Esdras" },
  { number: "15", name: "Nehemías" },
  { number: "16", name: "Ester" },
  { number: "17", name: "Daniel" },
  { number: "18", name: "Joel" },
  { number: "19", name: "Jonás" },
  { number: "20", name: "Mateo" },
  { number: "21", name: "Marcos" },
  { number: "22", name: "Lucas" },
  { number: "23", name: "Juan" },
  { number: "24", name: "Hechos" },
] as const;

export const followerBiblicalBookOptions = [
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

export const biblicalBookOptions = [
  ...pioneerBiblicalBookOptions,
  ...followerBiblicalBookOptions,
];

export const isBiblicalBookName = (value: string) =>
  biblicalBookOptions.some((book) => book.name === value);

export const getBiblicalBookOptions = (awardId?: string | null) => {
  if (awardId?.startsWith("pioneros-biblico-")) {
    return pioneerBiblicalBookOptions;
  }

  if (awardId?.startsWith("seguidores-biblico-")) {
    return followerBiblicalBookOptions;
  }

  return [];
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
