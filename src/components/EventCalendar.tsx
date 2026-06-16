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
  const selectedDate = value instanceof Date ? value : new Date();

  const setToday = () => onChange(new Date());

  useEffect(() => {
    if (value instanceof Date) {
      router.push(`?date=${value}`);
    }
  }, [value, router]);

  return (
    <div className="event-calendar-shell">
      <div className="event-calendar-date-pill">
        <span className="event-calendar-date-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 2v4" />
            <path d="M16 2v4" />
            <path d="M3 10h18" />
            <rect x="3" y="4" width="18" height="18" rx="2" />
          </svg>
        </span>
        <span className="event-calendar-date-copy">
          <span>Fecha de reunion</span>
          <strong>
            {new Intl.DateTimeFormat("es-PA", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }).format(selectedDate)}
          </strong>
        </span>
        <span className="event-calendar-date-caret" aria-hidden="true">
          ^
        </span>
      </div>

      <div className="event-calendar-card">
        <p className="event-calendar-eyebrow">Selecciona la reunion</p>
        <Calendar
          locale="es-ES"
          onChange={onChange}
          value={value}
          next2Label={null}
          prev2Label={null}
          prevLabel={<span aria-hidden="true">&lt;</span>}
          nextLabel={<span aria-hidden="true">&gt;</span>}
          formatShortWeekday={(_, date) =>
            new Intl.DateTimeFormat("es-PA", { weekday: "short" })
              .format(date)
              .replace(".", "")
              .toUpperCase()
          }
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
