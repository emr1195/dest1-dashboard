"use client";

import { getRankOption, rankOptionsByRole } from "@/lib/roles";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ProfileRankEditor = ({
  id,
  type,
  rank,
  canEdit,
}: {
  id: string;
  type: "student" | "teacher";
  rank?: string | null;
  canEdit: boolean;
}) => {
  const router = useRouter();
  const [selectedRank, setSelectedRank] = useState(rank || "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const option = getRankOption(type, selectedRank);
  const options = rankOptionsByRole[type] || [];

  useEffect(() => {
    setSelectedRank(rank || "");
    setEditing(false);
  }, [rank]);

  const saveRank = async (value: string) => {
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/profile-rank", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type, rank: value }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.message || "No se pudo guardar el rango.");
        return;
      }

      setSelectedRank(data.rank || "");
      setEditing(false);
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  if (!option && !canEdit) return null;

  return (
    <>
      {option && canEdit && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Cambiar rango"
          aria-label={`Cambiar rango ${option.label}`}
          className="absolute left-[116px] top-[132px] z-20 h-14 w-16 rounded-md bg-white/10 p-0 shadow-md transition hover:ring-2 hover:ring-white/80"
        >
          <Image
            src={option.image}
            alt={`Insignia ${option.label}`}
            width={64}
            height={56}
            className="h-14 w-16 rounded-md object-contain"
          />
        </button>
      )}

      {option && !canEdit && (
        <Image
          src={option.image}
          alt={`Insignia ${option.label}`}
          width={64}
          height={56}
          className="absolute left-[116px] top-[132px] z-20 h-14 w-16 rounded-md object-contain shadow-md"
        />
      )}

      {!option && canEdit && !editing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="absolute left-1/2 top-[176px] -translate-x-1/2 whitespace-nowrap rounded-md bg-white/15 px-3 py-1 text-xs text-white hover:bg-white/25"
        >
          Asignar rango
        </button>
      )}

      {canEdit && editing && (
        <div className="absolute left-0 top-[204px] z-30 mt-2 w-72 rounded-md bg-white p-2 text-gray-700 shadow-xl ring-1 ring-gray-200">
          <p className="mb-2 px-2 text-xs font-medium text-gray-500">Seleccionar rango</p>
          <button
            type="button"
            onClick={() => saveRank("")}
            disabled={saving}
            className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-60"
          >
            Sin rango
          </button>
          {options.map((item) => (
            <button
              type="button"
              key={item.label}
              onClick={() => saveRank(item.label)}
              disabled={saving}
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-60"
            >
              <Image src={item.image} alt="" width={34} height={34} className="h-8 w-8 object-contain" />
              <span>{item.label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={saving}
            className="mt-1 w-full rounded-md border border-gray-200 p-2 text-xs"
          >
            Cancelar
          </button>
        </div>
      )}

      {error && <p className="absolute left-0 top-[204px] mt-2 text-xs text-red-100">{error}</p>}
    </>
  );
};

export default ProfileRankEditor;
