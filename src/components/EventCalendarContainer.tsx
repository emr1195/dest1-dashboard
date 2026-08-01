import Link from "next/link";
import EventCalendar from "./EventCalendar";
import EventList from "./EventList";
import prisma from "@/lib/prisma";

const EventCalendarContainer = async ({
  searchParams,
}: {
  searchParams: { [keys: string]: string | undefined };
}) => {
  const events = await prisma.event.findMany({ select: { startTime: true } });
  const eventDates = events.map((event) => event.startTime.toISOString().slice(0, 10));

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl border border-[#DCE4EE] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <EventCalendar eventDates={eventDates} />
      </section>
      <section className="rounded-2xl border border-[#DCE4EE] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="text-lg font-bold text-[#0F2747]">Próximas actividades</h2><p className="mt-1 text-sm text-[#64748B]">Agenda general del destacamento</p></div>
          <Link href="/list/events" className="text-sm font-semibold text-[#1565C0] hover:underline">Ver todas</Link>
        </div>
        <div className="mt-4 flex flex-col divide-y divide-[#E8EDF3]">
          <EventList limit={3} />
        </div>
      </section>
    </div>
  );
};

export default EventCalendarContainer;
