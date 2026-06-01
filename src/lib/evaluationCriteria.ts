export type EvaluationTargetType = "student" | "teacher";

export const evaluationCriteria: Record<EvaluationTargetType, string[]> = {
  student: [
    "Asistencia",
    "Uniforme",
    "Tareas",
    "Comportamiento",
    "Biblia",
    "Cuaderno",
    "Puntualidad",
  ],
  teacher: [
    "Asistencia",
    "Accesibilidad del lider",
    "Desarrollo de Ascenso de la senda",
    "Puntualidad",
  ],
};

export const calculateEvaluationScore = (
  userType: EvaluationTargetType,
  aspectScores: unknown
) => {
  const availableCriteria = evaluationCriteria[userType];
  const suppliedScores =
    typeof aspectScores === "object" && aspectScores !== null
      ? (aspectScores as Record<string, unknown>)
      : {};
  const validScores = Object.fromEntries(
    availableCriteria.map((criterion) => {
      const numericValue = Number(suppliedScores[criterion]);
      const score = Number.isFinite(numericValue)
        ? Math.min(10, Math.max(0, numericValue))
        : 0;

      return [criterion, score];
    })
  ) as Record<string, number>;
  const average =
    availableCriteria.reduce((total, criterion) => total + validScores[criterion], 0) /
    availableCriteria.length;

  return {
    aspectScores: validScores,
    score: average / 10,
  };
};
