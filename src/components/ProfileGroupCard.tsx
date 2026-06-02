"use client";

import { getLeaderGroupOption, leaderGroupOptions } from "@/lib/roles";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type GroupDisplay = {
  name: string;
  icon: string;
};

const ProfileGroupCard = ({
  id,
  type,
  groupValue,
  fallbackGroup,
  canEdit,
}: {
  id: string;
  type: "student" | "teacher";
  groupValue?: string | null;
  fallbackGroup: GroupDisplay;
  canEdit: boolean;
}) => {
  const router = useRouter();
  const [selectedGroup, setSelectedGroup] = useState(groupValue || "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSelectedGroup(groupValue || "");
    setEditing(false);
  }, [groupValue]);

  const displayedGroup = useMemo(() => {
    const option = getLeaderGroupOption(selectedGroup);

    return option
      ? { name: option.label, icon: option.image }
      : fallbackGroup;
  }, [fallbackGroup, selectedGroup]);

  const saveGroup = async (value: string) => {
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/profile-group", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type, group: value }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.message || "No se pudo guardar el grupo.");
        return;
      }

      setSelectedGroup(data.group || "");
      setEditing(false);
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex min-h-[200px] w-full flex-col items-center justify-center gap-3 rounded-md bg-white p-4 text-center">
      {canEdit && (
        <button
          type="button"
          onClick={() => setEditing((open) => !open)}
          className="absolute right-3 top-3 rounded-md px-2 py-1 text-xs font-medium text-lamaSky hover:bg-lamaSkyLight"
        >
          Cambiar
        </button>
      )}

      <Image
        src={displayedGroup.icon}
        alt={displayedGroup.name}
        width={96}
        height={96}
        className="h-24 w-24 object-contain"
      />
      <h1 className="text-xl font-semibold">{displayedGroup.name}</h1>

      {canEdit && editing && (
        <div className="absolute right-3 top-12 z-30 w-72 rounded-md bg-white p-2 text-left shadow-xl ring-1 ring-gray-200">
          <p className="mb-2 px-2 text-xs font-medium text-gray-500">Seleccionar grupo</p>
          {leaderGroupOptions.map((item) => (
            <button
              type="button"
              key={item.value}
              onClick={() => saveGroup(item.value)}
              disabled={saving}
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              <Image src={item.image} alt="" width={38} height={38} className="h-9 w-9 object-contain" />
              <span>{item.label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={saving}
            className="mt-1 w-full rounded-md border border-gray-200 p-2 text-xs text-gray-700"
          >
            Cancelar
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default ProfileGroupCard;
