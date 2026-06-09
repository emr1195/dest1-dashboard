import MeetingPlanner from "@/components/MeetingPlanner";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

const PlannerPage = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser) redirect("/");
  if (currentUser.role !== "admin" && currentUser.role !== "teacher") {
    redirect("/auth/redirect");
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <MeetingPlanner />
    </div>
  );
};

export default PlannerPage;
