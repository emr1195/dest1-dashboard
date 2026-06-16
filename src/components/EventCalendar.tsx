"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

const EventCalendar = () => {
  const [value, onChange] = useState<Value>(new Date());

  const router = useRouter();

  const setToday = () => onChange(new Date());

  useEffect(() => {
    if (value instanceof Date) {
      router.push(`?date=${value}`);
    }
  }, [value, router]);

  return (
    <div className="event-calendar-shell">
      <div className="event-calendar-card">
        <Calendar
          className="event-calendar-side-layout"
          locale="es-ES"
          onChange={onChange}
          value={value}
          next2Label={null}
          prev2Label={null}
          prevLabel={<span aria-hidden="true">&lt;</span>}
          formatShortWeekday={(_, date) =>
            new Intl.DateTimeFormat("es-PA", { weekday: "short" })
              .format(date)
              .replace(".", "")
              .toUpperCase()
          }
          nextLabel={<span aria-hidden="true">&gt;</span>}
        />
        <div className="event-calendar-footer">
          <span className="event-calendar-selected-label">
            <span aria-hidden="true" />
            Fecha seleccionada
          </span>
          <button type="button" onClick={setToday}>
            Ir a hoy
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;
