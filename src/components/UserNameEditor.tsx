"use client";

import { leaderGroupOptions, rankOptionsByRole } from "@/lib/roles";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

type EditableProfileType = "teacher" | "student" | "parent";

type UserNameEditorProps = {
  id: string;
  type: EditableProfileType;
  name: string;
  surname: string;
};

type UserForm = {
  username: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  address: string;
  birthday: string;
  sex: "MALE" | "FEMALE" | "UNSPECIFIED";
  rank: string;
  group: string;
  guardianName: string;
  childrenNames: string;
  password: string;
};

const emptyForm: UserForm = {
  username: "",
  name: "",
  surname: "",
  email: "",
  phone: "",
  address: "",
  birthday: "",
  sex: "UNSPECIFIED",
  rank: "",
  group: "",
  guardianName: "",
  childrenNames: "",
  password: "",
};

const inputClass =
  "w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-lamaSky";

const UserNameEditor = ({ id, type, name, surname }: UserNameEditorProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<UserForm>({
    ...emptyForm,
    name,
    surname,
  });
  const router = useRouter();

  const setField = <K extends keyof UserForm>(
    field: K,
    value: UserForm[K]
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openEditor = async () => {
    setOpen(true);
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/profile-name?id=${encodeURIComponent(id)}&type=${type}`,
        { cache: "no-store" }
      );
      const result = await response.json().catch(() => null);

      if (!response.ok || !result) {
        setError(result?.message || "No se pudo cargar el usuario.");
        return;
      }

      setForm({
        ...emptyForm,
        username: result.username || "",
        name: result.name || "",
        surname: result.surname || "",
        email: result.email || "",
        phone: result.phone || "",
        address: result.address || "",
        birthday: result.birthday || "",
        sex: result.sex || "UNSPECIFIED",
        rank: result.rank || "",
        group: result.group || "",
        guardianName: result.guardianName || "",
        childrenNames: result.childrenNames || "",
      });
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/profile-name", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type, ...form }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.message || "No se pudo actualizar el usuario.");
        return;
      }

      toast("Usuario actualizado");
      setOpen(false);
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  };

  const ranks = rankOptionsByRole[type] || [];
  const hasRankAndGroup = type === "teacher" || type === "student";

  return (
    <>
      <button
        type="button"
        onClick={openEditor}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-transparent text-lamaSky transition hover:bg-gray-100"
        aria-label="Editar usuario"
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
          <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-md bg-white p-6">
            <button
              type="button"
              className="absolute right-4 top-4"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
            >
              <Image src="/close.png" alt="" width={16} height={16} />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-semibold">Editar usuario</h2>
              <p className="mt-1 text-sm text-gray-500">
                Modifica la información y los permisos del perfil.
              </p>
            </div>

            {loading ? (
              <p className="py-10 text-center text-gray-500">
                Cargando información...
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-gray-600">
                  Nombre
                  <input
                    value={form.name}
                    onChange={(event) => setField("name", event.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-gray-600">
                  Apellido
                  <input
                    value={form.surname}
                    onChange={(event) =>
                      setField("surname", event.target.value)
                    }
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-gray-600">
                  Usuario
                  <input
                    value={form.username}
                    onChange={(event) =>
                      setField("username", event.target.value)
                    }
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-gray-600">
                  Correo
                  <input
                    value={form.email}
                    onChange={(event) => setField("email", event.target.value)}
                    className={inputClass}
                    type="email"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-gray-600">
                  Teléfono
                  <input
                    value={form.phone}
                    onChange={(event) => setField("phone", event.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-gray-600">
                  Fecha de nacimiento
                  <input
                    value={form.birthday}
                    onChange={(event) =>
                      setField("birthday", event.target.value)
                    }
                    className={inputClass}
                    type="date"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-gray-600 sm:col-span-2">
                  Dirección
                  <input
                    value={form.address}
                    onChange={(event) =>
                      setField("address", event.target.value)
                    }
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-gray-600">
                  Género
                  <select
                    value={form.sex}
                    onChange={(event) =>
                      setField("sex", event.target.value as UserForm["sex"])
                    }
                    className={inputClass}
                  >
                    <option value="UNSPECIFIED">Sin especificar</option>
                    <option value="MALE">Masculino</option>
                    <option value="FEMALE">Femenino</option>
                  </select>
                </label>

                {hasRankAndGroup && (
                  <>
                    <label className="flex flex-col gap-2 text-sm font-medium text-gray-600">
                      Rango
                      <select
                        value={form.rank}
                        onChange={(event) =>
                          setField("rank", event.target.value)
                        }
                        className={inputClass}
                      >
                        <option value="">Sin rango</option>
                        {ranks.map((rank) => (
                          <option key={rank.label} value={rank.label}>
                            {rank.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-medium text-gray-600">
                      Grupo
                      <select
                        value={form.group}
                        onChange={(event) =>
                          setField("group", event.target.value)
                        }
                        className={inputClass}
                      >
                        <option value="">Sin grupo</option>
                        {leaderGroupOptions.map((group) => (
                          <option key={group.value} value={group.value}>
                            {group.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}

                {type === "student" && (
                  <label className="flex flex-col gap-2 text-sm font-medium text-gray-600 sm:col-span-2">
                    Nombre del padre o madre
                    <input
                      value={form.guardianName}
                      onChange={(event) =>
                        setField("guardianName", event.target.value)
                      }
                      className={inputClass}
                    />
                  </label>
                )}

                {type === "parent" && (
                  <label className="flex flex-col gap-2 text-sm font-medium text-gray-600 sm:col-span-2">
                    Nombres de los hijos
                    <textarea
                      value={form.childrenNames}
                      onChange={(event) =>
                        setField("childrenNames", event.target.value)
                      }
                      className={`${inputClass} min-h-24 resize-y`}
                    />
                  </label>
                )}

                <label className="flex flex-col gap-2 text-sm font-medium text-gray-600 sm:col-span-2">
                  Nueva contraseña
                  <input
                    value={form.password}
                    onChange={(event) =>
                      setField("password", event.target.value)
                    }
                    className={inputClass}
                    type="password"
                    placeholder="Déjala vacía para conservar la actual"
                    minLength={6}
                  />
                </label>
              </div>
            )}

            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

            {!loading && (
              <button
                type="button"
                disabled={saving}
                onClick={saveProfile}
                className="mt-6 w-full rounded-md bg-lamaSky px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default UserNameEditor;
