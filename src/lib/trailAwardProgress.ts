export const TRAIL_AWARD_MINIMUM_PERCENT = 70;

export type TrailProgressAssignment = {
  category: string;
  points: number;
  results: { score: number }[];
  submissions: { status: string }[];
};

export type TrailAwardProgressState =
  | "completed"
  | "pending"
  | "returned"
  | "locked";

const normalizeCategory = (category: string) =>
  category
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const trailCategoryRequiresMinimum = (category: string) => {
  const normalized = normalizeCategory(category);

  return (
    normalized.includes("liderazgo") ||
    normalized.includes("destreza") ||
    normalized.includes("adiestramiento") ||
    normalized.includes("estudio biblico") ||
    normalized.includes("reto espiritual")
  );
};

export const calculateTrailAwardPercentage = (
  assignments: TrailProgressAssignment[]
) => {
  const percentages = assignments.flatMap((assignment) =>
    assignment.results.map((result) =>
      Math.min(100, (result.score / Math.max(assignment.points, 1)) * 100)
    )
  );

  if (!percentages.length) return null;

  return percentages.reduce((total, value) => total + value, 0) / percentages.length;
};

export const getTrailAwardProgress = (
  assignments: TrailProgressAssignment[]
): {
  state: TrailAwardProgressState;
  percentage: number | null;
  requiresMinimum: boolean;
} => {
  const requiresMinimum = assignments.some((assignment) =>
    trailCategoryRequiresMinimum(assignment.category)
  );
  const percentage = calculateTrailAwardPercentage(assignments);
  const hasReviewedSubmission = assignments.some((assignment) =>
    assignment.submissions.some((submission) => submission.status === "reviewed")
  );

  if (
    requiresMinimum
      ? percentage !== null && percentage >= TRAIL_AWARD_MINIMUM_PERCENT
      : percentage !== null || hasReviewedSubmission
  ) {
    return { state: "completed", percentage, requiresMinimum };
  }

  if (
    assignments.some((assignment) =>
      assignment.submissions.some((submission) => submission.status === "returned")
    )
  ) {
    return { state: "returned", percentage, requiresMinimum };
  }

  if (assignments.some((assignment) => assignment.submissions.length > 0)) {
    return { state: "pending", percentage, requiresMinimum };
  }

  return { state: "locked", percentage, requiresMinimum };
};

export const formatTrailAwardProgress = (percentage: number) =>
  new Intl.NumberFormat("es-PA", {
    maximumFractionDigits: Number.isInteger(percentage) ? 0 : 1,
  }).format(percentage);
