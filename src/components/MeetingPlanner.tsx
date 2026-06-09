"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type PlannerGroup = {
  id: string;
  name: string;
  icon: string;
  color: string;
  light: string;
};

type PlannerItem = {
  number: number;
  title: string;
  time?: string;
  starred?: boolean;
};

type LeaderOption = {
  id: string;
  name: string;
};

type PlannerNotes = Record<string, Record<number, { leaderId: string; detail: string }>>;

const groups: PlannerGroup[] = [
  {
    id: "navegantes",
    name: "Navegantes",
    icon: "/navegantes-card.png",
    color: "#F2A900",
    light: "#FFF1C7",
  },
  {
    id: "pioneros",
    name: "Pioneros",
    icon: "/pioneros-card.png",
    color: "#004A92",
    light: "#E6EEF7",
  },
  {
    id: "seguidores",
    name: "Seguidores",
    icon: "/seguidores-card.png",
    color: "#702382",
    light: "#F2E7F5",
  },
  {
    id: "exploradores",
    name: "Exploradores",
    icon: "/exploradores-card.png",
    color: "#3DA435",
    light: "#E8F6E8",
  },
];

const plannerItems: PlannerItem[] = [
  { number: 1, title: "Mientras llegan los exploradores" },
  { number: 2, title: "Ceremonia de apertura", time: "1-5 min." },
  { number: 3, title: "Asuntos generales / Rincon de patrulla", time: "3-10 min." },
  { number: 4, title: "Estudio biblico", time: "15-20 min.", starred: true },
  { number: 5, title: "Seccion especial del programa", time: "15-25 min.", starred: true },
  { number: 6, title: "Periodo de ascenso", time: "5-10 min." },
  { number: 7, title: "Recreacion", time: "10-15 min.", starred: true },
  { number: 8, title: "Devocional", time: "5 min.", starred: true },
  { number: 9, title: "Ceremonia de clausura", time: "1-5 min." },
  { number: 10, title: "Despues de la reunion" },
];

const storageKey = "er-meeting-planner";
const dateStorageKey = "er-meeting-planner-date";

const MeetingPlanner = ({ leaders }: { leaders: LeaderOption[] }) => {
  const [activeGroupId, setActiveGroupId] = useState(groups[0].id);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<PlannerNotes>({});
  const [meetingDate, setMeetingDate] = useState("");

  const activeGroup = useMemo(
    () => groups.find((group) => group.id === activeGroupId) || groups[0],
    [activeGroupId]
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setNotes(JSON.parse(saved));
      setMeetingDate(window.localStorage.getItem(dateStorageKey) || "");
    } catch {
      setNotes({});
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    window.localStorage.setItem(dateStorageKey, meetingDate);
  }, [meetingDate]);

  const updateItem = (
    itemNumber: number,
    field: "leaderId" | "detail",
    value: string
  ) => {
    setNotes((current) => ({
      ...current,
      [activeGroup.id]: {
        ...(current[activeGroup.id] || {}),
        [itemNumber]: {
          leaderId: current[activeGroup.id]?.[itemNumber]?.leaderId || "",
          detail: current[activeGroup.id]?.[itemNumber]?.detail || "",
          [field]: value,
        },
      },
    }));
  };

  return (
    <div className="flex flex-col gap-5 rounded-md bg-white p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <Image
            src={activeGroup.icon}
            alt={activeGroup.name}
            width={150}
            height={110}
            className="h-24 w-36 object-contain sm:h-28 sm:w-44"
          />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
              Planificador de Reunion
            </h1>
            <label className="mt-2 flex max-w-sm items-center gap-2 text-base text-gray-600">
              <span>Semana:</span>
              <input
                type="date"
                value={meetingDate}
                onChange={(event) => setMeetingDate(event.target.value)}
                className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-lamaSky"
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          {groups.map((group) => {
            const active = group.id === activeGroup.id;

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setActiveGroupId(group.id)}
                className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                  active ? "text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
                style={{
                  borderColor: group.color,
                  backgroundColor: active ? group.color : undefined,
                }}
              >
                <Image
                  src={group.icon}
                  alt=""
                  width={30}
                  height={30}
                  className="h-7 w-7 object-contain"
                />
                <span>{group.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {plannerItems.map((item) => {
          const itemKey = `${activeGroup.id}-${item.number}`;
          const isOpen = Boolean(openItems[itemKey]);
          const savedItemNotes = notes[activeGroup.id]?.[item.number];
          const itemNotes = {
            leaderId: savedItemNotes?.leaderId || "",
            detail: savedItemNotes?.detail || "",
          };

          return (
            <div key={item.number} className="relative pl-7 sm:pl-10">
              <div
                className="grid min-h-14 w-full grid-cols-1 items-center gap-3 rounded-r-md border px-3 py-3 pl-10 text-left shadow-sm transition hover:shadow-md sm:grid-cols-[minmax(0,1fr)_260px_115px_42px] sm:pl-12"
                style={{
                  borderColor: activeGroup.color,
                  backgroundColor: activeGroup.light,
                }}
              >
                <span
                  className="absolute left-0 flex h-14 w-14 items-center justify-center rounded-full border-[8px] bg-white text-2xl font-semibold text-gray-500 sm:h-16 sm:w-16 sm:text-3xl"
                  style={{ borderColor: activeGroup.color }}
                >
                  {item.number}
                </span>

                <span className="min-w-0 break-words text-lg font-bold uppercase tracking-normal text-gray-500 sm:text-xl">
                  {item.title}
                  {item.starred ? " *" : ""}
                </span>

                <label className="flex min-w-0 items-center gap-2 text-sm font-semibold text-gray-500 sm:text-base">
                  Lider:
                  <select
                    value={itemNotes.leaderId}
                    onChange={(event) =>
                      updateItem(item.number, "leaderId", event.target.value)
                    }
                    className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-600 outline-none focus:border-lamaSky"
                  >
                    <option value="">Seleccionar</option>
                    {leaders.map((leader) => (
                      <option key={leader.id} value={leader.id}>
                        {leader.name}
                      </option>
                    ))}
                  </select>
                </label>

                <span className="min-h-6 text-sm font-bold text-gray-500 sm:text-right sm:text-lg">
                  {item.time || ""}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setOpenItems((current) => ({
                      ...current,
                      [itemKey]: !current[itemKey],
                    }))
                  }
                  aria-label={isOpen ? "Cerrar detalle" : "Abrir detalle"}
                  className={`ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white transition ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  style={{ backgroundColor: activeGroup.color }}
                >
                  v
                </button>
              </div>

              {isOpen && (
                <div className="ml-3 rounded-b-md border border-t-0 bg-white p-4 sm:ml-6">
                  <label className="flex flex-col gap-2 text-sm font-medium text-gray-600">
                    Informacion del punto
                    <textarea
                      value={itemNotes.detail}
                      onChange={(event) =>
                        updateItem(item.number, "detail", event.target.value)
                      }
                      placeholder="Coloca aqui los detalles, instrucciones o materiales necesarios."
                      rows={4}
                      className="resize-y rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-lamaSky"
                    />
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MeetingPlanner;
