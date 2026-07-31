"use client";

import { useRouter } from "next/navigation";
import { DragEvent, useRef, useState } from "react";

export type UploadedAssignmentFile = {
  id: string;
  fileName: string;
  filePath: string;
  href?: string;
  deleteUrl?: string;
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
}) => {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const deleteFile = async (file: UploadedAssignmentFile) => {
    if (!file.deleteUrl) return;
    if (!window.confirm("Seguro que quieres eliminar esta entrega?")) return;

    setDeleting(file.id);

    try {
      const response = await fetch(file.deleteUrl, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) router.refresh();
    } finally {
      setDeleting(null);
    }
  };

  return (
  <div className="flex flex-col gap-3">
      <h3 className="text-lg font-extrabold text-[var(--text-primary)]">{title}</h3>
      {files.length ? (
        files.map((file) => (
          <div key={file.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border-soft)] bg-white p-3 transition hover:border-[var(--primary)] sm:flex-nowrap">
            <span className="grid h-11 min-w-11 shrink-0 place-items-center rounded-lg bg-[var(--primary-soft)] px-1 text-[10px] font-extrabold text-[var(--primary)]">
              {fileIcon(file.fileName)}
            </span>
            <span className="min-w-0 flex-1 basis-[calc(100%-3.5rem)] sm:basis-auto">
              <span className="block truncate text-sm font-bold text-[var(--text-primary)]">{file.fileName}</span>
              <span className="mt-1 block truncate text-xs text-[var(--text-secondary)]">
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
            <a href={file.href || file.filePath} target={file.href ? undefined : "_blank"} rel={file.href ? undefined : "noreferrer"} title={`Ver ${file.fileName}`} className="ml-auto inline-flex min-h-10 items-center rounded-lg px-3 text-xs font-bold text-[var(--primary)] hover:bg-[var(--primary-soft)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)] sm:ml-0">Ver</a>
            {file.deleteUrl && (
              <button
                type="button"
                disabled={deleting === file.id}
                onClick={() => deleteFile(file)}
                className="min-h-10 rounded-lg px-3 text-xs font-bold text-red-600 hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:opacity-50"
              >
                {deleting === file.id ? "Eliminando..." : "Eliminar"}
              </button>
            )}
          </div>
        ))
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--surface-secondary)] p-5 text-center text-sm text-[var(--text-secondary)]">
          <p className="font-bold text-[var(--text-primary)]">Sin archivos</p>
          <p className="mt-1">{emptyLabel}</p>
        </div>
      )}
    </div>
  );
};

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
    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-extrabold text-[var(--text-primary)]">{title}</h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p>
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
          className={`flex min-h-[210px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
            dragging ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--border-default)]"
          } ${canUpload ? "bg-[var(--surface-secondary)]" : "bg-gray-50 opacity-70"}`}
        >
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></svg>
          </div>
          <p className="font-bold text-[var(--text-primary)]">Arrastra tu archivo aquí</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Un archivo por entrega</p>
          <span className="my-3 text-xs font-bold uppercase text-[var(--text-muted)]">o</span>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={!canUpload || saving}
            className="min-h-11 rounded-xl bg-[var(--primary)] px-6 text-sm font-bold text-white transition hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60"
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
