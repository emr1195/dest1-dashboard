"use client";

import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import "moment/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useEffect, useMemo, useState } from "react";

moment.locale("es");
const localizer = momentLocalizer(moment);

const messages = {
  date: "Fecha", time: "Hora", event: "Actividad", allDay: "Todo el día",
  week: "Semana", work_week: "Semana", day: "Día", month: "Mes",
  previous: "Anterior", next: "Siguiente", yesterday: "Ayer", tomorrow: "Mañana",
  today: "Hoy", agenda: "Agenda", noEventsInRange: "No hay eventos programados para este período.",
  showMore: (total: number) => `+${total} más`,
};

type CalendarEventItem = {
  title: string;
  start: Date;
  end: Date;
  deadlineStatus?: "ontime" | "soon" | "late";
};

const BigCalendar = ({ data, hideEventTime = false }: { data: CalendarEventItem[]; hideEventTime?: boolean }) => {
  const [view, setView] = useState<View>(Views.WORK_WEEK);
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const updateView = () => { if (media.matches) setView(Views.DAY); };
    updateView();
    media.addEventListener("change", updateView);
    return () => media.removeEventListener("change", updateView);
  }, []);

  const rangeLabel = useMemo(() => {
    if (view === Views.MONTH) return moment(date).format("MMMM YYYY");
    if (view === Views.DAY) return moment(date).format("dddd D [de] MMMM YYYY");
    const start = moment(date).startOf("isoWeek");
    const end = start.clone().add(4, "days");
    return start.month() === end.month()
      ? `${start.format("D")}–${end.format("D [de] MMMM YYYY")}`
      : `${start.format("D MMM")}–${end.format("D MMM YYYY")}`;
  }, [date, view]);

  const changePeriod = (direction: -1 | 1) => {
    const unit = view === Views.MONTH ? "month" : view === Views.DAY ? "day" : "week";
    setDate(moment(date).add(direction, unit).toDate());
  };

  const eventStyleGetter = (event: CalendarEventItem) => {
    const styles = {
      ontime: { backgroundColor: "#EFF6FF", borderColor: "#60A5FA", color: "#1E3A8A" },
      soon: { backgroundColor: "#FEF3C7", borderColor: "#F59E0B", color: "#92400E" },
      late: { backgroundColor: "#FEF2F2", borderColor: "#F87171", color: "#991B1B" },
      default: { backgroundColor: "#EFF6FF", borderColor: "#93C5FD", color: "#1E3A8A" },
    };
    return { style: { ...(styles[event.deadlineStatus || "default"]), borderWidth: 1, borderRadius: 8, fontWeight: 600, padding: "4px 6px", whiteSpace: "normal" as const } };
  };

  return (
    <div className="leader-weekly-calendar">
      <div className="leader-calendar-toolbar">
        <div>
          <h2 className="capitalize">{rangeLabel}</h2>
          <p>Agenda de tareas, reuniones y actividades</p>
        </div>
        <div className="leader-calendar-actions">
          <div className="leader-calendar-navigation" aria-label="Navegación de fechas">
            <button type="button" onClick={() => changePeriod(-1)} aria-label="Período anterior">&lt;</button>
            <button type="button" onClick={() => setDate(new Date())}>Hoy</button>
            <button type="button" onClick={() => changePeriod(1)} aria-label="Período siguiente">&gt;</button>
          </div>
          <div className="leader-calendar-view-switcher" aria-label="Vista del calendario">
            {[{ value: Views.DAY, label: "Día" }, { value: Views.WORK_WEEK, label: "Semana" }, { value: Views.MONTH, label: "Mes" }].map((item) => (
              <button key={item.value} type="button" onClick={() => setView(item.value)} aria-pressed={view === item.value} className={view === item.value ? "is-active" : ""}>{item.label}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="leader-calendar-canvas">
        <Calendar
          localizer={localizer}
          events={data}
          startAccessor="start"
          endAccessor="end"
          views={[Views.WORK_WEEK, Views.DAY, Views.MONTH]}
          view={view}
          date={date}
          onView={setView}
          onNavigate={setDate}
          toolbar={false}
          min={new Date(2025, 1, 0, 8, 0, 0)}
          max={new Date(2025, 1, 0, 18, 0, 0)}
          culture="es"
          messages={messages}
          formats={hideEventTime ? { eventTimeRangeFormat: () => "" } : undefined}
          eventPropGetter={eventStyleGetter}
          components={{ event: ({ event }) => <span title={`${event.title}: ${moment(event.start).format("LT")}–${moment(event.end).format("LT")}`}>{event.title}</span> }}
        />
      </div>
      <div className="leader-calendar-legend" aria-label="Leyenda del calendario">
        <span><i className="bg-[#22C55E]" />Reunión</span>
        <span><i className="bg-[#F59E0B]" />Actividad</span>
        <span><i className="bg-[#3B82F6]" />Tarea</span>
        <span><i className="bg-[#8B5CF6]" />Recordatorio</span>
      </div>
    </div>
  );
};

export default BigCalendar;
