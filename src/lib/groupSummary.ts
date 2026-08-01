const quarterLabels = ["Primer trimestre", "Segundo trimestre", "Tercer trimestre", "Cuarto trimestre"];

const getPanamaMonth = (date: Date) =>
  Number(
    new Intl.DateTimeFormat("en-US", {
      month: "numeric",
      timeZone: "America/Panama",
    }).format(date)
  );

export const getStudentPathProgress = (age: number, date = new Date()) => {
  let path = "Etapa por definir";

  if ([5, 8, 11].includes(age)) path = "Primer año · Senda Bronce";
  else if ([6, 9, 12].includes(age)) path = "Segundo año · Senda Plata";
  else if ([7, 10, 13].includes(age)) path = "Tercer año · Senda Oro";
  else if (age === 14) path = "Senda del Sable";
  else if (age === 15) path = "Senda E1";
  else if (age === 16) path = "Senda E2";
  else if (age === 17) path = "Senda E3";

  const month = getPanamaMonth(date);
  const quarter = quarterLabels[Math.floor((month - 1) / 3)];

  return { path, quarter };
};
