type FinancialMovement = {
  type: string;
  amount: number;
  date: Date;
};

export type FinanceChartEntry = {
  name: string;
  income: number;
  expense: number;
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

export const currentFinanceYearRange = () => {
  const year = new Date().getFullYear();

  return {
    year,
    from: new Date(year, 0, 1),
    to: new Date(year + 1, 0, 1),
  };
};

export const getFinanceChartData = (movements: FinancialMovement[]) => {
  const data = MONTH_LABELS.map((name) => ({ name, income: 0, expense: 0 }));

  movements.forEach((movement) => {
    const month = movement.date.getMonth();

    if (movement.type === "INGRESO") {
      data[month].income += movement.amount;
    } else if (movement.type === "GASTO") {
      data[month].expense += movement.amount;
    }
  });

  return data;
};
