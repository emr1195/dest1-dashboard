export type SkillAverageSource = {
  score: number;
  category: string;
};

const normalizeCategory = (category: string) =>
  category
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const isSkillAwardResult = ({ category }: SkillAverageSource) => {
  const normalized = normalizeCategory(category);

  return normalized.includes("destreza") || normalized.includes("adiestramiento");
};

export const calculateSkillAwardAverage = (
  results: SkillAverageSource[]
) => {
  const skillResults = results.filter(isSkillAwardResult);
  const totalScore = skillResults.reduce(
    (total, result) => total + result.score,
    0
  );

  return {
    totalScore,
    resultCount: skillResults.length,
    average: skillResults.length ? totalScore / skillResults.length : null,
  };
};

export const formatPointAverage = (average: number | null) => {
  if (average === null) return "—";

  return new Intl.NumberFormat("es-PA", {
    minimumFractionDigits: Number.isInteger(average) ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(average);
};
