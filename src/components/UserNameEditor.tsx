"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

type UserNameEditorProps = {
  id: string;
  type: "teacher" | "student" | "parent";
  name: string;
  surname: string;
};

const UserNameEditor = ({ id, type, name, surname }: UserNameEditorProps) => {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState(name);
  const [lastName, setLastName] = useState(surname);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const saveName = async () => {
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/profile-name", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          type,
          name: firstName,
          surname: lastName,
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.message || "No se pudo actualizar el nombre.");
        return;
      }

      toast("Nombre actualizado!");
      setOpen(false);
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-transparent text-lamaSky transition hover:bg-gray-100"
        aria-label="Editar nombre"
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

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-3">
          <div className="relative w-full max-w-lg rounded-md bg-white p-6">
            <button
              type="button"
              className="absolute right-4 top-4"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </button>

            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-semibold">Editar nombre</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Corrige el nombre y apellido del usuario.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-gray-600">
                  Nombre
                  <input
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm outline-none focus:border-lamaSky"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-gray-600">
                  Apellido
                  <input
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm outline-none focus:border-lamaSky"
                  />
                </label>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="button"
                disabled={saving}
                onClick={saveName}
                className="rounded-md bg-lamaSky px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserNameEditor;
