import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

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

const dataDir = path.join(process.cwd(), "data");
const dataPath = path.join(dataDir, "evaluations.json");

export const isEvaluationDay = (date = new Date()) => {
  const activeMonths = [2, 5, 8, 11];

  return date.getDate() === 1 && activeMonths.includes(date.getMonth());
};

export const readEvaluations = async (): Promise<EvaluationRecord[]> => {
  try {
    return JSON.parse(await readFile(dataPath, "utf8")) as EvaluationRecord[];
  } catch {
    return [];
  }
};

export const writeEvaluations = async (records: EvaluationRecord[]) => {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataPath, JSON.stringify(records, null, 2));
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
