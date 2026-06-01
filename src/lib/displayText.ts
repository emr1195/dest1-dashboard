export const translateDisplayText = (value?: string | null) => {
  if (!value) return "";

  const translated = value
    .replace(/^Announcement\b/i, "Anuncio")
    .replace(/^Description for Announcement\b/i, "Descripcion del anuncio")
    .replace(/^Event\b/i, "Actividad")
    .replace(/^Description for Event\b/i, "Descripcion de la actividad")
    .replace(/^Assignment\b/i, "Tarea")
    .replace(/^Lesson\s*/i, "Leccion ");

  const dictionary: Record<string, string> = {
    English: "Ingles",
    History: "Historia",
    Geography: "Geografia",
    Physics: "Fisica",
    Chemistry: "Quimica",
    Biology: "Biologia",
    "Computer Science": "Informatica",
    Art: "Arte",
    Mathematics: "Matematicas",
    Science: "Ciencias",
  };

  return dictionary[translated] || translated;
};
