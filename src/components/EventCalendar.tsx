"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

const EventCalendar = ({ eventDates = [] }: { eventDates?: string[] }) => {
  const [value, onChange] = useState<Value>(new Date());
  const [activeStartDate, setActiveStartDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const router = useRouter();
  const eventDateSet = new Set(eventDates);
  const selectedDateKey = value instanceof Date
    ? [value.getFullYear(), String(value.getMonth() + 1).padStart(2, "0"), String(value.getDate()).padStart(2, "0")].join("-")
    : "";
  const selectedEventCount = eventDates.filter((date) => date === selectedDateKey).length;

  const calendarMonth = new Intl.DateTimeFormat("es-PA", { month: "long" })
    .format(activeStartDate)
    .replace(/^./, (firstLetter) => firstLetter.toUpperCase());

  const setToday = () => {
    const today = new Date();

    onChange(today);
    setActiveStartDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const changeMonth = (offset: number) => {
    setActiveStartDate(
      (currentDate) =>
        new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1)
    );
  };

  const handleChange = (nextValue: Value) => {
    onChange(nextValue);

    if (nextValue instanceof Date) {
      setActiveStartDate(
        new Date(nextValue.getFullYear(), nextValue.getMonth(), 1)
      );
    }
  };

  useEffect(() => {
    if (value instanceof Date) {
      const dateKey = [
        value.getFullYear(),
        String(value.getMonth() + 1).padStart(2, "0"),
        String(value.getDate()).padStart(2, "0"),
      ].join("-");

      router.push(`?date=${dateKey}`);
    }
  }, [value, router]);

  return (
    <div className="event-calendar-shell">
      <div className="event-calendar-card">
        <div className="event-calendar-heading">
          <div><h2>Calendario mensual</h2><p>Selecciona una fecha para consultar la agenda</p></div>
        </div>
        <div className="event-calendar-side-layout">
          <div className="event-calendar-month-nav">
            <div className="event-calendar-month-label">
              <span>{calendarMonth}</span>
              <span>{activeStartDate.getFullYear()}</span>
            </div>
            <div className="event-calendar-month-arrows">
              <button
                className="event-calendar-today"
                type="button"
                onClick={setToday}
              >
                Hoy
              </button>
              <button
                type="button"
                aria-label="Mes anterior"
                onClick={() => changeMonth(-1)}
              >
                &lt;
              </button>
              <button
                type="button"
                aria-label="Mes siguiente"
                onClick={() => changeMonth(1)}
              >
                &gt;
              </button>
            </div>
          </div>
          <Calendar
            locale="es-ES"
            onChange={handleChange}
            value={value}
            activeStartDate={activeStartDate}
            showNavigation={false}
            formatShortWeekday={(_, date) =>
              new Intl.DateTimeFormat("es-PA", { weekday: "short" })
                .format(date)
                .replace(".", "")
                .toUpperCase()
            }
            tileContent={({ date, view }) => {
              if (view !== "month") return null;
              const dateKey = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
              return eventDateSet.has(dateKey) ? <span className="event-calendar-event-dot" aria-label="Hay una actividad" /> : null;
            }}
          />
        </div>
        <div className="event-calendar-footer">
          <div>
            <span className="event-calendar-selected-label"><span aria-hidden="true" />{selectedEventCount} {selectedEventCount === 1 ? "actividad" : "actividades"} para esta fecha</span>
            <Link href={selectedDateKey ? `?date=${selectedDateKey}` : "?"} className="event-calendar-day-link">Ver agenda del día</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;
