"use client";

import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import "moment/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";

moment.locale("es");

const localizer = momentLocalizer(moment);

const messages = {
  date: "Fecha",
  time: "Hora",
  event: "Actividad",
  allDay: "Todo el dia",
  week: "Semana",
  work_week: "Semana laboral",
  day: "Dia",
  month: "Mes",
  previous: "Anterior",
  next: "Siguiente",
  yesterday: "Ayer",
  tomorrow: "Manana",
  today: "Hoy",
  agenda: "Agenda",
  noEventsInRange: "No hay actividades en este rango.",
  showMore: (total: number) => `+${total} mas`,
};

const BigCalendar = ({
  data,
}: {
  data: { title: string; start: Date; end: Date; deadlineStatus?: "ontime" | "soon" | "late" }[];
}) => {
  const [view, setView] = useState<View>(Views.WORK_WEEK);

  const handleOnChangeView = (selectedView: View) => {
    setView(selectedView);
  };

  return (
    <div className="h-full min-w-[720px]">
      <Calendar
        localizer={localizer}
        events={data}
        startAccessor="start"
        endAccessor="end"
        views={["work_week", "day"]}
        view={view}
        style={{ height: "98%" }}
        onView={handleOnChangeView}
        min={new Date(2025, 1, 0, 8, 0, 0)}
        max={new Date(2025, 1, 0, 17, 0, 0)}
        culture="es"
        messages={messages}
        eventPropGetter={(event) => {
          if (!event.deadlineStatus) return {};

          const colors = {
            ontime: {
              backgroundColor: "#dcfce7",
              borderColor: "#22c55e",
              color: "#166534",
            },
            soon: {
              backgroundColor: "#fef3c7",
              borderColor: "#f59e0b",
              color: "#92400e",
            },
            late: {
              backgroundColor: "#fee2e2",
              borderColor: "#ef4444",
              color: "#991b1b",
            },
          }[event.deadlineStatus];

          return {
            style: {
              ...colors,
              borderWidth: 2,
              fontWeight: 600,
            },
          };
        }}
      />
    </div>
  );
};

export default BigCalendar;
