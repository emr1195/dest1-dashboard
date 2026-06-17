import { dateKeyToUtcDate, getTodayDateKey } from "./timeZone";

type FinancialMovement = {
  type: string;
  category?: string | null;
  title?: string | null;
  amount: number;
  date: Date;
};

export type FinanceChartDetail = {
  title: string;
  category: string;
  amount: number;
  dateLabel: string;
};

export type FinanceChartEntry = {
  name: string;
  income: number;
  expense: number;
  incomeDetails: FinanceChartDetail[];
  expenseDetails: FinanceChartDetail[];
};

const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const formatFinanceDate = (date: Date) =>
  new Intl.DateTimeFormat("es-PA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

export const currentFinanceYearRange = () => {
  const year = Number(getTodayDateKey().slice(0, 4));

  return {
    year,
    from: dateKeyToUtcDate(`${year}-01-01`),
    to: dateKeyToUtcDate(`${year + 1}-01-01`),
  };
};

export const getFinanceChartData = (movements: FinancialMovement[]) => {
  const data = MONTH_LABELS.map((name) => ({
    name,
    income: 0,
    expense: 0,
    incomeDetails: [] as FinanceChartDetail[],
    expenseDetails: [] as FinanceChartDetail[],
  }));

  movements.forEach((movement) => {
    const month = movement.date.getUTCMonth();
    const detail = {
      title: movement.title || "Movimiento financiero",
      category: movement.category || "Sin categoria",
      amount: movement.amount,
      dateLabel: formatFinanceDate(movement.date),
    };

    if (movement.type === "INGRESO") {
      data[month].income += movement.amount;
      data[month].incomeDetails.push(detail);
    } else if (movement.type === "GASTO") {
      data[month].expense += movement.amount;
      data[month].expenseDetails.push(detail);
    }
  });

  return data;
};
