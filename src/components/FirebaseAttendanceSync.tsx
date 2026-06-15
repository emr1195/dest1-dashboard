"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type SyncResult = {
  members: number;
  attendance: number;
  changed: number;
  firebaseUpdatedAt: string | null;
};

const FirebaseAttendanceSync = () => {
  const router = useRouter();
  const syncingRef = useRef(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(
    "Conectando con el control de asistencia..."
  );
  const [hasError, setHasError] = useState(false);

  const synchronize = useCallback(
    async (showProgress = false) => {
      if (syncingRef.current) return;

      syncingRef.current = true;
      setSyncing(true);
      setHasError(false);
      if (showProgress) setMessage("Sincronizando asistencia...");

      try {
        const response = await fetch("/api/attendance/firebase-sync", {
          method: "POST",
          cache: "no-store",
        });
        const result = (await response.json().catch(() => null)) as
          | SyncResult
          | { message?: string }
          | null;

        if (!response.ok || !result || !("members" in result)) {
          setHasError(true);
          setMessage(
            (result && "message" in result && result.message) ||
              "No se pudo sincronizar Firebase."
          );
          return;
        }

        setMessage(
          `${result.members} miembros y ${result.attendance} asistencias sincronizados.`
        );
        if (result.changed > 0) router.refresh();
      } catch {
        setHasError(true);
        setMessage("No se pudo conectar con Firebase.");
      } finally {
        syncingRef.current = false;
        setSyncing(false);
      }
    },
    [router]
  );

  useEffect(() => {
    void synchronize();
    const interval = window.setInterval(() => void synchronize(), 30000);
    return () => window.clearInterval(interval);
  }, [synchronize]);

  return (
    <div
      className={`mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm ${
        hasError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      <div>
        <p className="font-semibold">Control de asistencia del Destacamento 1</p>
        <p className="mt-1 text-xs opacity-80">{message}</p>
      </div>
      <button
        type="button"
        disabled={syncing}
        onClick={() => void synchronize(true)}
        className="rounded-md bg-emerald-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        {syncing ? "Sincronizando..." : "Sincronizar ahora"}
      </button>
    </div>
  );
};

export default FirebaseAttendanceSync;
