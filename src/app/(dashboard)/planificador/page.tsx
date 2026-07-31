import MeetingPlanner, { SavedPlannerItem } from "@/components/MeetingPlanner";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

const PlannerPage = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser) redirect("/");
  if (currentUser.role !== "admin" && currentUser.role !== "teacher") {
    redirect("/auth/redirect");
  }

  const leaders = await prisma.lider.findMany({
    select: {
      id: true,
      name: true,
      surname: true,
    },
    orderBy: [{ name: "asc" }, { surname: "asc" }],
  });

  const planners = await prisma.meetingPlanner.findMany({
    orderBy: [{ meetingDate: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <MeetingPlanner
        currentRole={currentUser.role}
        leaders={leaders.map((leader) => ({
          id: leader.id,
          name: `${leader.name} ${leader.surname}`,
        }))}
        initialPlanners={planners.map((planner) => ({
          id: planner.id,
          group: planner.group,
          groupName: planner.groupName,
          meetingDate: planner.meetingDate.toISOString(),
          selectedDate: planner.selectedDate?.toISOString() || null,
          weekStart: planner.weekStart?.toISOString() || null,
          weekEnd: planner.weekEnd?.toISOString() || null,
          weekKey: planner.weekKey,
          year: planner.year,
          status:
            planner.status === "published" ? "published" : "draft",
          items: planner.items as SavedPlannerItem[],
          createdById: planner.createdById,
          createdByName: planner.createdByName,
          createdAt: planner.createdAt.toISOString(),
          updatedAt: planner.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
};

export default PlannerPage;
