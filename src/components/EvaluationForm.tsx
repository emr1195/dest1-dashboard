"use client";

import { FormEvent, useEffect, useState } from "react";
import { evaluationCriteria } from "@/lib/evaluationCriteria";
import Image from "next/image";
import { useRouter } from "next/navigation";

type EvaluationUser = {
  id: string;
  type: "student" | "teacher";
  name: string;
  surname: string;
  img?: string | null;
};

const EvaluationForm = () => {
  const [users, setUsers] = useState<EvaluationUser[]>([]);
  const [evaluatorRole, setEvaluatorRole] = useState("");
  const [userKey, setUserKey] = useState("");
  const [aspectScores, setAspectScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadUsers = async () => {
      const response = await fetch("/api/evaluations?mode=users");
      const data = await response.json().catch(() => null);

      if (response.ok && Array.isArray(data?.users)) {
        setUsers(data.users);
        setEvaluatorRole(data.evaluatorRole || "");
        const firstUser = data.users[0];
        if (firstUser && data.evaluatorRole !== "teacher") {
          setUserKey(`${firstUser.type}:${firstUser.id}`);
        }
      }

      setLoadingUsers(false);
    };

    loadUsers();
  }, []);

  const selectedUser = users.find((user) => `${user.type}:${user.id}` === userKey);
  const availableCriteria = selectedUser ? evaluationCriteria[selectedUser.type] : [];
  const score10 =
    availableCriteria.length > 0
      ? availableCriteria.reduce(
          (total, criterion) => total + (aspectScores[criterion] ?? 0),
          0
        ) / availableCriteria.length
      : 0;
  const title =
    evaluatorRole === "teacher"
      ? "Evaluacion de muchachos"
      : evaluatorRole === "student"
        ? "Evaluacion del lider"
        : "Evaluacion";
  const selectionLabel =
    evaluatorRole === "teacher"
      ? "Muchacho"
      : evaluatorRole === "student"
        ? "Lider"
        : "Persona evaluada";

  const updateAspectScore = (criterion: string, value: number) => {
    setAspectScores((previous) => ({
      ...previous,
      [criterion]: value,
    }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const [userType, userId] = userKey.split(":");

    const response = await fetch("/api/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, userType, aspectScores, notes }),
    });
    const data = await response.json().catch(() => null);

    setLoading(false);

    if (!response.ok) {
      setMessage(data?.message || "No se pudo guardar la evaluacion.");
      return;
    }

    setMessage(`Evaluacion guardada: ${(data.score10 as number).toFixed(1)} / 10`);
    setAspectScores({});
    setNotes("");
    if (evaluatorRole === "teacher") setUserKey("");
    router.refresh();
  };

  if (loadingUsers) {
    return (
      <div className="max-w-3xl rounded-md bg-white p-6 text-sm text-gray-500">
        Cargando evaluacion...
      </div>
    );
  }

  if (evaluatorRole === "teacher" && !selectedUser) {
    return (
      <section className="max-w-3xl rounded-md bg-white p-6">
        <h1 className="text-xl font-semibold">Evaluacion de muchachos</h1>
        <h2 className="mt-6 text-sm font-medium text-gray-500">Muchachos de mi grupo</h2>
        {users.length ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  setUserKey(`${user.type}:${user.id}`);
                  setAspectScores({});
                  setMessage("");
                }}
                className="flex items-center gap-3 rounded-md border border-gray-200 p-3 text-left transition hover:border-lamaSky hover:bg-lamaSkyLight"
              >
                <Image
                  src={user.img || "/noAvatar.png"}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-full object-cover"
                />
                <span className="font-medium text-gray-700">
                  {user.name} {user.surname}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-md border border-dashed border-gray-200 p-5 text-sm text-gray-500">
            No hay muchachos asignados a tu grupo.
          </p>
        )}
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-5 rounded-md bg-white p-6">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>

      {evaluatorRole === "teacher" && selectedUser ? (
        <div className="flex items-center justify-between gap-4 rounded-md border border-gray-200 p-3 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-gray-500">Muchacho evaluado</span>
            <span className="font-medium text-gray-700">
              {selectedUser.name} {selectedUser.surname}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setUserKey("")}
            className="rounded-md border border-gray-200 px-3 py-2 text-lamaBlue hover:bg-lamaSkyLight"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <label className="flex flex-col gap-2 text-sm text-gray-500">
          {selectionLabel}
          <select
            value={userKey}
            onChange={(event) => {
              setUserKey(event.target.value);
              setAspectScores({});
            }}
            className="rounded-md p-3 ring-[1.5px] ring-gray-300"
            required
          >
            {!users.length && <option value="">Sin usuarios disponibles</option>}
            {users.map((user) => (
              <option value={`${user.type}:${user.id}`} key={`${user.type}:${user.id}`}>
                {user.type === "teacher" ? "Lider" : "Muchacho"} - {user.name} {user.surname}
              </option>
            ))}
          </select>
        </label>
      )}

      {!!availableCriteria.length && (
        <fieldset className="flex flex-col gap-3 rounded-md border border-gray-200 p-4">
          <legend className="px-1 text-sm font-medium text-gray-600">Aspectos</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {availableCriteria.map((criterion) => (
              <label
                key={criterion}
                className="flex flex-col gap-2 rounded-md border border-gray-100 p-3 text-sm text-gray-700"
              >
                <span className="flex items-center justify-between gap-3">
                  <span>{criterion}</span>
                  <span className="font-medium text-lamaBlue">
                    {aspectScores[criterion] ?? 0} / 10
                  </span>
                </span>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={aspectScores[criterion] ?? 0}
                  onChange={(event) =>
                    updateAspectScore(criterion, Number(event.target.value))
                  }
                  className="w-full accent-lamaSky"
                />
              </label>
            ))}
          </div>
          <p className="text-sm font-medium text-lamaBlue">
            Resultado: {score10.toFixed(1)} / 10
          </p>
        </fieldset>
      )}

      <label className="flex flex-col gap-2 text-sm text-gray-500">
        Notas
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="min-h-28 rounded-md p-3 ring-[1.5px] ring-gray-300"
        />
      </label>

      {message && <p className="text-sm text-lamaBrown">{message}</p>}

      <button
        type="submit"
        disabled={loading || !userKey || !availableCriteria.length}
        className="rounded-md bg-lamaSky p-3 font-medium text-white disabled:opacity-60"
      >
        {loading ? "Guardando..." : "Guardar evaluacion"}
      </button>
    </form>
  );
};

export default EvaluationForm;
