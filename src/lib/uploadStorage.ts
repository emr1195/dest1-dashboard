const DEFAULT_MAX_UPLOAD_SIZE = 12 * 1024 * 1024;

type UploadOptions = {
  allowedMimePrefixes?: string[];
  allowedMimeTypes?: string[];
  maxSize?: number;
};

export const sanitizeFileName = (fileName: string, fallback: string) => {
  const safeName = fileName.replace(/[^\w.\- ]/g, "").trim();
  return safeName || fallback;
};

export const fileToDataUrl = async (
  file: File,
  {
    allowedMimePrefixes = [],
    allowedMimeTypes = [],
    maxSize = DEFAULT_MAX_UPLOAD_SIZE,
  }: UploadOptions = {}
) => {
  const mimeType = file.type || "application/octet-stream";
  const allowedByPrefix = allowedMimePrefixes.some((prefix) =>
    mimeType.startsWith(prefix)
  );
  const allowedByType = allowedMimeTypes.includes(mimeType);

  if (
    (allowedMimePrefixes.length || allowedMimeTypes.length) &&
    !allowedByPrefix &&
    !allowedByType
  ) {
    throw new Error("Tipo de archivo no permitido.");
  }

  if (file.size > maxSize) {
    throw new Error("El archivo es demasiado grande.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
};

export const documentMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
];
