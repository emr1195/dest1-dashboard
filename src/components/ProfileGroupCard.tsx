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
  studentCount,
  upcomingActivityCount,
  agendaVariant = false,
  studentProgress,
}: {
  id: string;
  type: "student" | "teacher";
  groupValue?: string | null;
  fallbackGroup: GroupDisplay;
  canEdit: boolean;
  studentCount?: number;
  upcomingActivityCount?: number;
  agendaVariant?: boolean;
  studentProgress?: { path: string; quarter: string };
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
    <div className={`relative flex w-full flex-col rounded-2xl border border-[#DCE4EE] bg-white shadow-[0_6px_20px_rgba(15,23,42,0.05)] ${agendaVariant ? "h-full min-h-[170px] items-start justify-center gap-3 overflow-visible border-t-4 border-t-[#7E22CE] p-4 text-left" : "min-h-[200px] items-center justify-center gap-3 p-4 text-center"}`}>
      {canEdit && (
        <button
          type="button"
          onClick={() => setEditing((open) => !open)}
          className={`${agendaVariant ? "relative order-last min-h-10 w-full self-center rounded-lg border border-[#C9D5E3] px-5 text-xs font-semibold text-[#7E22CE] hover:bg-[#FAF5FF] sm:w-auto" : "absolute right-3 top-3 rounded-md px-2 py-1 text-xs font-medium text-lamaSky hover:bg-lamaSkyLight"}`}
        >
          {agendaVariant ? "Cambiar grupo" : "Cambiar"}
        </button>
      )}

      <div className={`flex ${agendaVariant ? "w-full items-center justify-center gap-6" : "flex-col items-center gap-3"}`}>
        <Image src={displayedGroup.icon} alt={displayedGroup.name} width={112} height={112} className={`${agendaVariant ? "h-28 w-28" : "h-24 w-24"} shrink-0 object-contain`} />
        <div>
          <h1 className="text-xl font-bold text-[#0F2747]">{displayedGroup.name}</h1>
          {agendaVariant && type === "student" && studentProgress ? (
            <div className="mt-2 space-y-1 text-sm text-[#64748B]">
              <p className="font-semibold text-[#7E22CE]">{studentProgress.path}</p>
              <p>{studentProgress.quarter}</p>
            </div>
          ) : agendaVariant ? (
            <div className="mt-2 space-y-1 text-sm text-[#64748B]">
              <p>{studentCount ?? 0} muchachos</p>
              <p>{upcomingActivityCount ?? 0} actividades próximas</p>
            </div>
          ) : null}
        </div>
      </div>

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
