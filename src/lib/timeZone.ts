export const APP_TIME_ZONE =
  process.env.NEXT_PUBLIC_APP_TIME_ZONE || "America/Panama";

const twoDigits = (value: number) => String(value).padStart(2, "0");

export const getDateKeyInTimeZone = (
  date = new Date(),
  timeZone = APP_TIME_ZONE
) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return date.toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
};

export const dateKeyToUtcDate = (dateKey: string, hour = 0) =>
  new Date(`${dateKey}T${twoDigits(hour)}:00:00.000Z`);

export const addDaysToDateKey = (dateKey: string, days: number) => {
  const date = dateKeyToUtcDate(dateKey);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
};

export const getMondayDateKey = (dateKey: string) => {
  const date = dateKeyToUtcDate(dateKey);
  const dayOfWeek = date.getUTCDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  return addDaysToDateKey(dateKey, -daysSinceMonday);
};

export const getTodayDateKey = (timeZone = APP_TIME_ZONE) =>
  getDateKeyInTimeZone(new Date(), timeZone);
