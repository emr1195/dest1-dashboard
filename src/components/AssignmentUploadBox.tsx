"use client";

import { useRouter } from "next/navigation";
import { DragEvent, useRef, useState } from "react";

export type UploadedAssignmentFile = {
  id: string;
  fileName: string;
  filePath: string;
  href?: string;
  ownerName?: string;
  detail?: string;
  statusLabel?: string;
  statusClassName?: string;
};

const fileIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "pdf") return "PDF";
  if (["xls", "xlsx", "csv"].includes(extension || "")) return "XLS";
  if (["doc", "docx"].includes(extension || "")) return "DOC";
  if (["png", "jpg", "jpeg", "webp"].includes(extension || "")) return "IMG";
  return "FILE";
};

const UploadedFilesList = ({
  title,
  files,
  emptyLabel,
}: {
  title: string;
  files: UploadedAssignmentFile[];
  emptyLabel: string;
}) => (
  <div className="flex flex-col gap-3">
    <h3 className="text-base font-semibold">{title}</h3>
    {files.length ? (
      files.map((file) => (
        <a
          key={file.id}
          href={file.href || file.filePath}
          target={file.href ? undefined : "_blank"}
          rel={file.href ? undefined : "noreferrer"}
          title={file.fileName}
          className="flex items-center gap-3 border border-gray-200 bg-white p-3 hover:border-lamaSky"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-lamaSky text-[10px] font-bold text-white">
            {fileIcon(file.fileName)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-gray-600">{file.fileName}</span>
            <span className="block truncate text-xs text-gray-500">
              {file.ownerName || "Completado"}
            </span>
            {file.detail && (
              <span className="mt-1 block truncate text-xs text-gray-500">
                {file.detail}
              </span>
            )}
          </span>
          {file.statusLabel && (
            <span
              className={`shrink-0 rounded-md px-3 py-1 text-xs font-semibold ${
                file.statusClassName || "bg-gray-100 text-gray-600"
              }`}
            >
              {file.statusLabel}
            </span>
          )}
          <span className="text-xs text-lamaBrown">Ver</span>
        </a>
      ))
    ) : (
      <div className="border border-dashed border-gray-200 p-4 text-sm text-gray-500">
        {emptyLabel}
      </div>
    )}
  </div>
);

const AssignmentUploadBox = ({
  assignmentId,
  uploadUrl,
  title,
  subtitle,
  buttonLabel,
  filesTitle,
  emptyLabel,
  files,
  canUpload,
}: {
  assignmentId: number;
  uploadUrl: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  filesTitle: string;
  emptyLabel: string;
  files: UploadedAssignmentFile[];
  canUpload: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const router = useRouter();

  const uploadFile = async (file?: File) => {
    if (!file || !canUpload) return;

    setSaving(true);

    const formData = new FormData();
    formData.append("assignmentId", String(assignmentId));
    formData.append("file", file);

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    setSaving(false);

    if (inputRef.current) inputRef.current.value = "";

    if (response.ok) {
      router.refresh();
    }
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    uploadFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-lamaSky">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple={false}
          onChange={(event) => uploadFile(event.target.files?.[0])}
        />
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (canUpload) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex min-h-[220px] flex-col items-center justify-center border-2 border-dashed p-6 text-center ${
            dragging ? "border-lamaPurple bg-lamaPurpleLight" : "border-lamaSky"
          } ${canUpload ? "bg-white" : "bg-gray-50 opacity-70"}`}
        >
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-lamaSkyLight text-3xl text-lamaSky">
            ^
          </div>
          <p className="text-lg font-semibold text-lamaSky">Arrastra archivos aqui</p>
          <p className="mt-2 text-sm text-gray-500">Un archivo por vez</p>
          <p className="my-3 font-semibold text-lamaSky">-O-</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={!canUpload || saving}
            className="bg-lamaSky px-8 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Subiendo..." : buttonLabel}
          </button>
        </div>
      </div>
      <UploadedFilesList title={filesTitle} files={files} emptyLabel={emptyLabel} />
    </div>
  );
};

export { UploadedFilesList };
export default AssignmentUploadBox;
