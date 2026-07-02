"use client";

import { useMemo, useState } from "react";

type DeadlineStatus = "ontime" | "soon" | "late";

type AssignmentCalendarItem = {
  id: number;
  title: string;
  category: string;
  dueDate: string;
  deadlineStatus: DeadlineStatus;
};

const weekDays = ["Lun", "Mar", "Mie", "Jue", "Vie"];

const statusStyles: Record<
  DeadlineStatus,
  { card: string; label: string; dot: string; text: string }
> = {
  ontime: {
    card: "border-green-200 bg-green-50",
    label: "A tiempo",
    dot: "bg-green-500",
    text: "text-green-700",
  },
  soon: {
    card: "border-yellow-200 bg-yellow-50",
    label: "Por vencer",
    dot: "bg-yellow-500",
    text: "text-yellow-800",
  },
  late: {
    card: "border-red-200 bg-red-50",
    label: "Vencida",
    dot: "bg-red-500",
    text: "text-red-700",
  },
};

const toPanamaDateKey = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Panama",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const getPanamaToday = () => {
  const [year, month, day] = toPanamaDateKey(new Date()).split("-").map(Number);
  return new Date(year, month - 1, day, 12);
};

const getMonday = (date: Date) => {
  const monday = new Date(date);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  monday.setHours(12, 0, 0, 0);
  return monday;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatWeekRange = (monday: Date) => {
  const friday = addDays(monday, 4);
  const month = new Intl.DateTimeFormat("es-PA", {
    month: "long",
    timeZone: "America/Panama",
  }).format(monday);

  return `${month} ${monday.getDate()} - ${friday.getDate()}`;
};

const formatDeadline = (value: string) =>
  new Intl.DateTimeFormat("es-PA", {
    timeZone: "America/Panama",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));

const StudentAssignmentCalendar = ({
  assignments,
}: {
  assignments: AssignmentCalendarItem[];
}) => {
  const [weekOffset, setWeekOffset] = useState(0);

  const monday = useMemo(() => {
    const date = getMonday(getPanamaToday());
    date.setDate(date.getDate() + weekOffset * 7);
    return date;
  }, [weekOffset]);

  const days = useMemo(
    () =>
      weekDays.map((label, index) => {
        const date = addDays(monday, index);
        const dateKey = toPanamaDateKey(date);

        return {
          label,
          date,
          dateKey,
          tasks: assignments.filter(
            (assignment) => toPanamaDateKey(new Date(assignment.dueDate)) === dateKey
          ),
        };
      }),
    [assignments, monday]
  );

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-500">Semana laboral</p>
          <p className="text-lg font-semibold capitalize text-gray-800">
            {formatWeekRange(monday)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekOffset((current) => current - 1)}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            className="rounded-md bg-lamaSky px-3 py-2 text-sm font-semibold text-white hover:bg-lamaSky/90"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset((current) => current + 1)}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Siguiente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 items-start gap-2 pb-2 sm:gap-3 md:grid-cols-5">
        {days.map((day) => (
          <section
            key={day.dateKey}
            className="flex min-w-0 flex-col rounded-md border border-gray-200 bg-gray-50 last:col-span-2 md:last:col-span-1"
          >
            <div className="border-b border-gray-200 bg-white p-3 text-center">
              <p className="text-sm font-bold uppercase text-gray-600">{day.label}</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{day.date.getDate()}</p>
            </div>

            <div className="flex min-w-0 flex-col gap-2 p-2 sm:p-3">
              {day.tasks.length ? (
                day.tasks.map((assignment) => {
                  const styles = statusStyles[assignment.deadlineStatus];

                  return (
                    <article
                      key={assignment.id}
                      className={`min-w-0 rounded-md border p-2 shadow-sm sm:p-3 ${styles.card}`}
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[11px] font-bold ${styles.text}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
                          {styles.label}
                        </span>
                        <span className="rounded-full bg-white/80 px-2 py-1 text-[11px] font-semibold text-gray-600">
                          {assignment.category}
                        </span>
                      </div>
                      <h3 className="break-words text-sm font-bold leading-snug text-gray-900">
                        {assignment.title}
                      </h3>
                      <p className="mt-2 text-xs font-medium text-gray-600">
                        Vence: {formatDeadline(assignment.dueDate)}
                      </p>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-md border border-dashed border-gray-200 bg-white p-3 text-center text-xs font-medium text-gray-500">
                  Sin tareas
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default StudentAssignmentCalendar;
