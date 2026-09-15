const normalizeUsernamePart = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const getStudentUsernameBase = (name: string, surname: string) =>
  `${normalizeUsernamePart(name).charAt(0)}${normalizeUsernamePart(surname)}`.slice(0, 20);

export const getStudentInitialPassword = (username: string) =>
  `${username}#ER2026`;
