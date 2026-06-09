import MeetingPlanner from "@/components/MeetingPlanner";
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

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <MeetingPlanner
        leaders={leaders.map((leader) => ({
          id: leader.id,
          name: `${leader.name} ${leader.surname}`,
        }))}
      />
    </div>
  );
};

export default PlannerPage;
