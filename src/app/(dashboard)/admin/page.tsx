import Announcements from "@/components/Announcements";
import AttendanceChartContainer from "@/components/AttendanceChartContainer";
import CountChartContainer from "@/components/CountChartContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import FinanceChart from "@/components/FinanceChart";
import UserCard from "@/components/UserCard";
import { currentFinanceYearRange, getFinanceChartData } from "@/lib/finances";
import prisma from "@/lib/prisma";

const AdminPage = async ({
  searchParams,
}: {
  searchParams: { [keys: string]: string | undefined };
}) => {
  const attendanceWeek = Number(searchParams.attendanceWeek || 0);
  const safeAttendanceWeek = Number.isFinite(attendanceWeek)
    ? attendanceWeek
    : 0;
  const { from, to } = currentFinanceYearRange();
  const financeTransactions = await prisma.financeTransaction.findMany({
    where: { date: { gte: from, lt: to } },
    select: { type: true, category: true, title: true, amount: true, date: true },
  });
  const financeData = getFinanceChartData(financeTransactions);

  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* LEFT */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
        {/* USER CARDS */}
        <div className="flex gap-4 justify-between flex-wrap">
          <UserCard type="admin" />
          <UserCard type="teacher" />
          <UserCard type="student" />
          <UserCard type="parent" />
        </div>
        {/* MIDDLE CHARTS */}
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* COUNT CHART */}
          <div className="w-full lg:w-1/3 h-[450px]">
            <CountChartContainer />
          </div>
          {/* ATTENDANCE CHART */}
          <div className="w-full lg:w-2/3 h-[450px]">
            <AttendanceChartContainer weekOffset={safeAttendanceWeek} />
          </div>
        </div>
        {/* BOTTOM CHART */}
        <div className="w-full h-[500px]">
          <FinanceChart data={financeData} />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full lg:w-1/3 flex flex-col gap-8">
        <EventCalendarContainer searchParams={searchParams}/>
        <Announcements />
      </div>
    </div>
  );
};

export default AdminPage;
