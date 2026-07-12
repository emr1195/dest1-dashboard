export const officeMimeTypes = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-visio.drawing",
  "application/vnd.ms-visio.drawing.macroenabled.12",
  "application/vnd.ms-project",
  "application/x-mspublisher",
];

export const officeExtensions = [
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "vsd",
  "vsdx",
  "vsdm",
  "mpp",
  "pub",
];

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
  if (host) return `${protocol || "https"}://${host}`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  return appUrl?.replace(/\/$/, "") || "";
};

export const getOfficePreviewUrl = (publicFileUrl: string) =>
  `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
    publicFileUrl
  )}`;
