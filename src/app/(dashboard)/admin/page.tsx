import Announcements from "@/components/Announcements";
import AttendanceChartContainer from "@/components/AttendanceChartContainer";
import CountChartContainer from "@/components/CountChartContainer";
import DashboardRefreshButton from "@/components/DashboardRefreshButton";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import FinanceChart from "@/components/FinanceChart";
import FirebaseAttendanceSync from "@/components/FirebaseAttendanceSync";
import UserCard from "@/components/UserCard";
import { currentFinanceYearRange, getFinanceChartData } from "@/lib/finances";
import prisma from "@/lib/prisma";

const AdminPage = async ({ searchParams }: { searchParams: { [keys: string]: string | undefined } }) => {
  const attendanceWeek = Number(searchParams.attendanceWeek || 0);
  const safeAttendanceWeek = Number.isFinite(attendanceWeek) ? attendanceWeek : 0;
  const { from, to } = currentFinanceYearRange();
  const financeTransactions = await prisma.financeTransaction.findMany({
    where: { date: { gte: from, lt: to } },
    select: { type: true, category: true, title: true, amount: true, date: true },
  });
  const financeData = getFinanceChartData(financeTransactions);
  const updatedAt = new Intl.DateTimeFormat("es-PA", {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Panama",
  }).format(new Date());

  return (
    <main className="min-h-full bg-[#F3F6FA] px-4 py-5 sm:px-6 lg:px-8">
      <FirebaseAttendanceSync />
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#1565C0]">Administración</p>
          <h1 className="mt-1 text-3xl font-bold text-[#0F2747]">Panel general</h1>
          <p className="mt-2 text-sm text-[#64748B]">Resumen del destacamento, asistencia, finanzas y próximas actividades.</p>
          <p className="mt-1 text-xs capitalize text-[#8290A3]">Actualizado {updatedAt}</p>
        </div>
        <DashboardRefreshButton />
      </header>

      <section aria-label="Indicadores generales" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <UserCard type="admin" />
        <UserCard type="teacher" />
        <UserCard type="student" />
        <UserCard type="parent" />
      </section>

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(330px,0.85fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(280px,0.75fr)_minmax(0,1.6fr)]">
            <CountChartContainer />
            <AttendanceChartContainer weekOffset={safeAttendanceWeek} />
          </div>
          <FinanceChart data={financeData} />
        </div>
        <aside className="flex min-w-0 flex-col gap-5">
          <EventCalendarContainer searchParams={searchParams} />
          <Announcements />
        </aside>
      </div>
    </main>
  );
};

export default AdminPage;
