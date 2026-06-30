import prisma from "../src/lib/prisma";

type PlannerItem = {
  number: number;
  leaderId: string;
  detail: string;
};

const normalizeItems = (value: unknown): PlannerItem[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => ({
      number: Number(item?.number),
      leaderId: typeof item?.leaderId === "string" ? item.leaderId : "",
      detail: typeof item?.detail === "string" ? item.detail : "",
    }))
    .filter((item) => Number.isFinite(item.number));
};

const mergeItems = (values: unknown[]) => {
  const items = new Map<number, PlannerItem>();

  values.forEach((value) => {
    normalizeItems(value).forEach((incoming) => {
      const current = items.get(incoming.number);
      items.set(incoming.number, {
        number: incoming.number,
        leaderId: incoming.leaderId || current?.leaderId || "",
        detail: incoming.detail || current?.detail || "",
      });
    });
  });

  return Array.from(items.values()).sort((a, b) => a.number - b.number);
};

const main = async () => {
  const planners = await prisma.meetingPlanner.findMany({
    orderBy: [{ createdAt: "asc" }, { updatedAt: "asc" }],
  });
  const grouped = new Map<string, typeof planners>();

  planners.forEach((planner) => {
    const key = `${planner.group}:${planner.meetingDate.toISOString()}`;
    grouped.set(key, [...(grouped.get(key) || []), planner]);
  });

  for (const duplicateGroup of Array.from(grouped.values())) {
    if (duplicateGroup.length < 2) continue;

    const [canonical, ...duplicates] = duplicateGroup;
    const mergedItems = mergeItems(duplicateGroup.map((planner) => planner.items));

    await prisma.$transaction([
      prisma.meetingPlanner.update({
        where: { id: canonical.id },
        data: { items: mergedItems },
      }),
      prisma.meetingPlanner.deleteMany({
        where: { id: { in: duplicates.map((planner) => planner.id) } },
      }),
    ]);
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
