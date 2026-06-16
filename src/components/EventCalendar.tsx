"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

const EventCalendar = () => {
  const [value, onChange] = useState<Value>(new Date());
  const [activeStartDate, setActiveStartDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const router = useRouter();

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
      router.push(`?date=${value}`);
    }
  }, [value, router]);

  return (
    <div className="event-calendar-shell">
      <div className="event-calendar-card">
        <div className="event-calendar-side-layout">
          <div className="event-calendar-month-nav">
            <div className="event-calendar-month-label">
              <span>{calendarMonth}</span>
              <span>{activeStartDate.getFullYear()}</span>
            </div>
            <div className="event-calendar-month-arrows">
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
          />
        </div>
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
