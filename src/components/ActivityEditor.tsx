"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";

type ActivityData = {
  id: number;
  title: string;
  description: string;
  image?: string | null;
  cost?: number | null;
  startTime: Date | string;
};

const localDateValue = (value?: Date | string) => {
  if (!value) return "";
  const date = new Date(value);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const ActivityEditor = ({
  activity,
  onClose,
}: {
  activity?: ActivityData;
  onClose?: () => void;
}) => {
  const router = useRouter();
  const [title, setTitle] = useState(activity?.title || "");
  const [description, setDescription] = useState(activity?.description || "");
  const [date, setDate] = useState(localDateValue(activity?.startTime));
  const [cost, setCost] = useState(activity?.cost?.toString() || "");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const preview = useMemo(
    () => (file ? URL.createObjectURL(file) : activity?.image || ""),
    [file, activity?.image]
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("date", date);
    formData.append("cost", cost);
    if (file) formData.append("poster", file);
    if (activity) formData.append("id", String(activity.id));

    try {
      const response = await fetch("/api/activities", {
        method: activity ? "PATCH" : "POST",
        body: formData,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.message || "No se pudo guardar la actividad.");
        return;
      }

      if (!activity) {
        setTitle("");
        setDescription("");
        setDate("");
        setCost("");
        setFile(null);
        setMessage("Actividad guardada.");
      }
      onClose?.();
      router.refresh();
    } catch {
      setMessage("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  };

  const selectPoster = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] || null);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <label className="flex flex-col gap-2 text-sm text-gray-600">
          Afiche de la actividad
          <span className="relative flex h-64 items-center justify-center overflow-hidden rounded-md border border-dashed border-lamaSky bg-gray-50">
            {preview ? (
              <Image src={preview} alt="Afiche de la actividad" fill className="object-cover" />
            ) : (
              <span className="px-4 text-center text-xs text-gray-500">
                Selecciona una imagen para el afiche
              </span>
            )}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={selectPoster}
            required={!activity?.image}
            className="text-xs file:mr-3 file:rounded-md file:border-0 file:bg-lamaSky file:px-3 file:py-2 file:text-white"
          />
        </label>

        <div className="grid content-start gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-gray-600 md:col-span-2">
            Nombre de la actividad
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="rounded-md border border-gray-300 p-3 outline-none focus:border-lamaSky"
              placeholder="Nombre de la actividad"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-gray-600 md:col-span-2">
            Descripcion
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              className="min-h-24 resize-y rounded-md border border-gray-300 p-3 outline-none focus:border-lamaSky"
              placeholder="Informacion de la actividad"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-gray-600">
            Fecha
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              className="rounded-md border border-gray-300 p-3 outline-none focus:border-lamaSky"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-gray-600">
            Costo (opcional)
            <input
              type="number"
              min="0"
              step="0.01"
              value={cost}
              onChange={(event) => setCost(event.target.value)}
              className="rounded-md border border-gray-300 p-3 outline-none focus:border-lamaSky"
              placeholder="Actividad gratuita"
            />
          </label>
        </div>
      </div>

      {message && <p className="text-sm text-lamaSky">{message}</p>}
      <div className="flex justify-end gap-3">
        {onClose && (
          <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm">
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-lamaSky px-6 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "Guardando..." : activity ? "Guardar cambios" : "Guardar actividad"}
        </button>
      </div>
    </form>
  );
};

export default ActivityEditor;
