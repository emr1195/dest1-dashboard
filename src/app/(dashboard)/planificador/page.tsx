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

  const currentLeaderAccount =
    currentUser.role === "teacher"
      ? await prisma.authUser.findFirst({
          where: {
            role: "teacher",
            OR: [
              { id: currentUser.id },
              ...(currentUser.email
                ? [{ email: currentUser.email.toLowerCase() }]
                : []),
            ],
          },
          select: { leaderGroup: true },
        })
      : null;
  const currentGroup = ["navegantes", "pioneros", "seguidores", "exploradores"].includes(
    currentLeaderAccount?.leaderGroup || ""
  )
    ? currentLeaderAccount?.leaderGroup || null
    : null;

  const planners = await prisma.meetingPlanner.findMany({
    where:
      currentUser.role === "admin"
        ? {}
        : currentGroup
          ? { group: currentGroup }
          : { createdById: currentUser.id },
    orderBy: [{ meetingDate: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <MeetingPlanner
        currentRole={currentUser.role}
        currentUserId={currentUser.id}
        currentGroup={currentGroup}
        leaders={leaders.map((leader) => ({
          id: leader.id,
          name: `${leader.name} ${leader.surname}`,
        }))}
        initialPlanners={planners.map((planner) => ({
          id: planner.id,
          group: planner.group,
          meetingDate: planner.meetingDate.toISOString(),
          items: planner.items as SavedPlannerItem[],
          createdById: planner.createdById,
          createdByName: planner.createdByName,
          createdAt: planner.createdAt.toISOString(),
        }))}
      />
    </div>
  );
};

export default PlannerPage;
