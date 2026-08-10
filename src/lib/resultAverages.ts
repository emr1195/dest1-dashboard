export type SkillAverageSource = {
  score: number;
  category: string;
};

export type ResultCategoryAverage = {
  totalScore: number;
  resultCount: number;
  average: number;
};

export type StudentResultAverageSummary = {
  skill: ResultCategoryAverage;
  biblical: ResultCategoryAverage;
  leadership: ResultCategoryAverage;
  complementary: ResultCategoryAverage;
  generalAverage: number;
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

export const isBiblicalStudyResult = ({ category }: SkillAverageSource) =>
  normalizeCategory(category).includes("estudio biblico");

export const isLeadershipAwardResult = ({ category }: SkillAverageSource) =>
  normalizeCategory(category).includes("liderazgo");

export const isComplementaryResult = ({ category }: SkillAverageSource) =>
  normalizeCategory(category) === "otros";

const calculateCategoryAverage = (
  results: SkillAverageSource[],
  predicate: (result: SkillAverageSource) => boolean
): ResultCategoryAverage => {
  const categoryResults = results.filter(predicate);
  const totalScore = categoryResults.reduce(
    (total, result) => total + result.score,
    0
  );

  return {
    totalScore,
    resultCount: categoryResults.length,
    average: categoryResults.length ? totalScore / categoryResults.length : 0,
  };
};

export const calculateSkillAwardAverage = (
  results: SkillAverageSource[]
) => {
  return calculateCategoryAverage(results, isSkillAwardResult);
};

export const calculateStudentResultAverages = (
  results: SkillAverageSource[]
): StudentResultAverageSummary => {
  const skill = calculateCategoryAverage(results, isSkillAwardResult);
  const biblical = calculateCategoryAverage(results, isBiblicalStudyResult);
  const leadership = calculateCategoryAverage(results, isLeadershipAwardResult);
  const complementary = calculateCategoryAverage(results, isComplementaryResult);
  const generalAverage =
    (skill.average +
      biblical.average +
      leadership.average +
      complementary.average) /
    4;

  return {
    skill,
    biblical,
    leadership,
    complementary,
    generalAverage,
  };
};

export const formatPointAverage = (average: number | null) => {
  if (average === null) return "—";

  return new Intl.NumberFormat("es-PA", {
    minimumFractionDigits: Number.isInteger(average) ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(average);
};
