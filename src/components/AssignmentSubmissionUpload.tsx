"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, useRef, useState } from "react";

const AssignmentSubmissionUpload = ({
  assignmentId,
  existingFilePath,
}: {
  assignmentId: number;
  existingFilePath?: string | null;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const uploadSubmission = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setSaving(true);

    const formData = new FormData();
    formData.append("assignmentId", String(assignmentId));
    formData.append("file", file);

    const response = await fetch("/api/assignment-submissions", {
      method: "POST",
      body: formData,
    });

    setSaving(false);
    event.target.value = "";

    if (response.ok) {
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={uploadSubmission}
      />
      {existingFilePath && (
        <a
          href={existingFilePath}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-lamaSky underline"
        >
          Ver respuesta
        </a>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={saving}
        className="w-max rounded-md bg-lamaSky px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
      >
        {saving
          ? "Subiendo..."
          : existingFilePath
            ? "Cambiar respuesta"
            : "Subir respuesta"}
      </button>
    </div>
  );
};

export default AssignmentSubmissionUpload;
