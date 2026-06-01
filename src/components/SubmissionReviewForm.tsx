"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const SubmissionReviewForm = ({
  submissionId,
  maxScore,
  defaultScore,
}: {
  submissionId: string;
  maxScore: number;
  defaultScore?: number;
}) => {
  const [score, setScore] = useState(String(defaultScore ?? maxScore));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/assignment-submissions/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, score: Number(score) }),
    });
    const data = await response.json().catch(() => null);

    setSaving(false);

    if (!response.ok) {
      setMessage(data?.message || "No se pudo revisar la tarea.");
      return;
    }

    setMessage("Tarea revisada correctamente.");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="rounded-md border border-gray-200 bg-white p-4">
      <h2 className="text-lg font-semibold">Revision de la tarea</h2>
      <label className="mt-4 flex flex-col gap-2 text-sm text-gray-500">
        Puntuacion
        <input
          value={score}
          onChange={(event) => setScore(event.target.value)}
          type="number"
          min={0}
          max={maxScore}
          className="rounded-md border border-gray-300 p-3 text-base text-gray-700 outline-none focus:border-lamaSky"
          required
        />
      </label>
      <p className="mt-2 text-xs text-gray-500">Maximo: {maxScore} puntos</p>
      {message && <p className="mt-3 text-sm text-lamaSky">{message}</p>}
      <button
        type="submit"
        disabled={saving}
        className="mt-5 w-full rounded-md bg-lamaSky px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Guardando..." : "Revisado"}
      </button>
    </form>
  );
};

export default SubmissionReviewForm;
