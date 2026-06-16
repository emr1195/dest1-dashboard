export const officeMimeTypes = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

export const officeExtensions = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"];

export const getFileExtension = (fileName: string) =>
  fileName.split(".").pop()?.toLowerCase() || "";

export const isOfficeFile = (fileName: string, fileType?: string | null) =>
  Boolean(
    (fileType && officeMimeTypes.includes(fileType)) ||
      officeExtensions.includes(getFileExtension(fileName))
  );

export const isImageFile = (fileName: string, fileType?: string | null) =>
  Boolean(
    fileType?.startsWith("image/") ||
      ["png", "jpg", "jpeg", "webp", "gif"].includes(getFileExtension(fileName))
  );

export const canPreviewFile = (fileName: string, fileType?: string | null) =>
  Boolean(
    isOfficeFile(fileName, fileType) ||
      isImageFile(fileName, fileType) ||
      fileType === "application/pdf" ||
      fileType?.startsWith("text/") ||
      ["pdf", "txt", "csv"].includes(getFileExtension(fileName))
  );

export const getPublicBaseUrl = (host: string | null, protocol?: string | null) => {
  const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) return appUrl.replace(/\/$/, "");

  if (!host) return "";

  return `${protocol || "https"}://${host}`;
};

export const getOfficePreviewUrl = (publicFileUrl: string) =>
  `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
    publicFileUrl
  )}`;
