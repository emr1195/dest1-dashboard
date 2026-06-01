"use client";

import type { Event } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import ActivityEditor from "./ActivityEditor";

const ActivityActions = ({ activity }: { activity: Event }) => {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const remove = async () => {
    if (!window.confirm("Seguro que quieres eliminar esta actividad?")) return;
    setDeleting(true);
    const response = await fetch(`/api/activities?id=${activity.id}`, { method: "DELETE" });
    setDeleting(false);
    if (response.ok) router.refresh();
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-transparent text-lamaSky transition hover:bg-gray-100"
          aria-label="Editar actividad"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={deleting}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-transparent text-red-600 transition hover:bg-gray-100 disabled:opacity-60"
          aria-label="Eliminar actividad"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </button>
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-md bg-white p-5">
            <h2 className="mb-5 text-xl font-semibold">Editar actividad</h2>
            <ActivityEditor activity={activity} onClose={() => setEditing(false)} />
          </div>
        </div>
      )}
    </>
  );
};

export default ActivityActions;
