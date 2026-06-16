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
  const [, setMessage] = useState(
    "Conectando con el control de asistencia..."
  );
  const [, setHasError] = useState(false);

  const synchronize = useCallback(
    async (showProgress = false) => {
      if (syncingRef.current) return;

      syncingRef.current = true;
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
      }
    },
    [router]
  );

  useEffect(() => {
    void synchronize();
    const interval = window.setInterval(() => void synchronize(), 30000);
    return () => window.clearInterval(interval);
  }, [synchronize]);

  // Sincronizacion silenciosa: el aviso visual queda oculto por ahora.
  return null;
};

export default FirebaseAttendanceSync;
