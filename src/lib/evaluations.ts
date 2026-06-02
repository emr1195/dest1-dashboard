import prisma from "@/lib/prisma";

export type EvaluationUserType = "student" | "teacher";

export type EvaluationRecord = {
  id: string;
  userId: string;
  userType: EvaluationUserType;
  score: number;
  criteria?: string[];
  aspectScores?: Record<string, number>;
  notes?: string;
  createdBy: string;
  createdAt: string;
};

export const isEvaluationDay = (date = new Date()) => {
  const activeMonths = [2, 5, 8, 11];

  return date.getDate() === 1 && activeMonths.includes(date.getMonth());
};

const toAspectScores = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, number>)
    : undefined;

export const readEvaluations = async (): Promise<EvaluationRecord[]> => {
  const records = await prisma.evaluation.findMany({
    orderBy: { createdAt: "asc" },
  });

  return records.map((record) => ({
    id: record.id,
    userId: record.userId,
    userType: record.userType as EvaluationUserType,
    score: record.score,
    aspectScores: toAspectScores(record.aspectScores),
    notes: record.notes || "",
    createdBy: record.createdBy,
    createdAt: record.createdAt.toISOString(),
  }));
};

export const writeEvaluations = async (records: EvaluationRecord[]) => {
  await prisma.$transaction([
    prisma.evaluation.deleteMany(),
    prisma.evaluation.createMany({
      data: records.map((record) => ({
        id: record.id,
        userId: record.userId,
        userType: record.userType,
        score: record.score,
        aspectScores: record.aspectScores,
        notes: record.notes || "",
        createdBy: record.createdBy,
        createdAt: new Date(record.createdAt),
      })),
    }),
  ]);
};

export const getLatestEvaluation = async (
  userId: string,
  userType: EvaluationUserType
) => {
  const records = await readEvaluations();
  const targetRecords = records
    .filter((record) => record.userId === userId && record.userType === userType)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const latestByEvaluator = new Map<string, EvaluationRecord>();

  targetRecords.forEach((record) => {
    if (!latestByEvaluator.has(record.createdBy)) {
      latestByEvaluator.set(record.createdBy, record);
    }
  });

  const latestRecords = Array.from(latestByEvaluator.values());
  const latestRecord = latestRecords[0];

  if (!latestRecord) return undefined;

  return {
    ...latestRecord,
    score:
      latestRecords.reduce((total, record) => total + record.score, 0) /
      latestRecords.length,
  };
};
