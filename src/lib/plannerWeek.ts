const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

const pad2 = (value: number) => String(value).padStart(2, "0");

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const parsePlannerDate = (value?: string | null) => {
  if (!value) return null;

  const match = value.match(DATE_KEY_PATTERN);
  if (!match) return null;

  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const addDaysToDateKey = (value: string, days: number) => {
  const date = parsePlannerDate(value);
  if (!date) return "";

  date.setDate(date.getDate() + days);
  return toDateKey(date);
};

export const getPlannerWeek = (value?: string | null) => {
  const selectedDate = parsePlannerDate(value);
  if (!selectedDate) return null;

  const weekStartDate = new Date(selectedDate);
  const mondayOffset = (selectedDate.getDay() + 6) % 7;
  weekStartDate.setDate(selectedDate.getDate() - mondayOffset);

  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);

  return {
    selectedDate: toDateKey(selectedDate),
    weekStart: toDateKey(weekStartDate),
    weekEnd: toDateKey(weekEndDate),
    weekKey: toDateKey(weekStartDate),
    year: weekStartDate.getFullYear(),
  };
};

export const getWeekKey = (value?: string | null) =>
  getPlannerWeek(value)?.weekKey || "";

const monthFormatter = new Intl.DateTimeFormat("es-PA", { month: "long" });
const shortMonthFormatter = new Intl.DateTimeFormat("es-PA", { month: "short" });
const weekdayFormatter = new Intl.DateTimeFormat("es-PA", { weekday: "long" });

const monthName = (date: Date) => monthFormatter.format(date);
const shortMonthName = (date: Date) =>
  shortMonthFormatter.format(date).replace(".", "");

export const formatPlannerMeetingDay = (value?: string | null) => {
  const date = parsePlannerDate(value);
  if (!date) return "";

  return `${weekdayFormatter.format(date)} ${date.getDate()} de ${monthName(
    date
  )} del ${date.getFullYear()}`;
};

export const formatPlannerWeek = (
  value?: string | null,
  options?: { compact?: boolean; includePrefix?: boolean }
) => {
  const week = getPlannerWeek(value);
  if (!week) return "";

  const start = parsePlannerDate(week.weekStart)!;
  const end = parsePlannerDate(week.weekEnd)!;
  const includePrefix = options?.includePrefix !== false;

  if (options?.compact) {
    const prefix = includePrefix ? "Semana " : "";
    if (start.getFullYear() === end.getFullYear()) {
      return `${prefix}${start.getDate()} ${shortMonthName(start)} - ${end.getDate()} ${shortMonthName(end)} ${end.getFullYear()}`;
    }

    return `${prefix}${start.getDate()} ${shortMonthName(start)} ${start.getFullYear()} - ${end.getDate()} ${shortMonthName(end)} ${end.getFullYear()}`;
  }

  const prefix = includePrefix ? "Semana del " : "";

  if (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth()
  ) {
    return `${prefix}${start.getDate()} al ${end.getDate()} de ${monthName(end)} de ${end.getFullYear()}`;
  }

  if (start.getFullYear() === end.getFullYear()) {
    return `${prefix}${start.getDate()} de ${monthName(start)} al ${end.getDate()} de ${monthName(end)} de ${end.getFullYear()}`;
  }

  return `${prefix}${start.getDate()} de ${monthName(start)} de ${start.getFullYear()} al ${end.getDate()} de ${monthName(end)} de ${end.getFullYear()}`;
};

export const formatPlannerDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("es-PA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};
