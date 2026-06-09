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

type PlannerNotes = Record<string, Record<number, { leader: string; detail: string }>>;

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

const MeetingPlanner = () => {
  const [activeGroupId, setActiveGroupId] = useState(groups[0].id);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<PlannerNotes>({});

  const activeGroup = useMemo(
    () => groups.find((group) => group.id === activeGroupId) || groups[0],
    [activeGroupId]
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setNotes(JSON.parse(saved));
    } catch {
      setNotes({});
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(notes));
  }, [notes]);

  const updateItem = (
    itemNumber: number,
    field: "leader" | "detail",
    value: string
  ) => {
    setNotes((current) => ({
      ...current,
      [activeGroup.id]: {
        ...(current[activeGroup.id] || {}),
        [itemNumber]: {
          leader: current[activeGroup.id]?.[itemNumber]?.leader || "",
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
            <div className="mt-2 flex items-center gap-2 text-base text-gray-600">
              <span>Semana:</span>
              <span className="h-px min-w-32 flex-1 bg-gray-500 sm:min-w-56" />
            </div>
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
          const itemNotes = notes[activeGroup.id]?.[item.number] || {
            leader: "",
            detail: "",
          };

          return (
            <div key={item.number} className="relative pl-7 sm:pl-10">
              <button
                type="button"
                onClick={() =>
                  setOpenItems((current) => ({
                    ...current,
                    [itemKey]: !current[itemKey],
                  }))
                }
                className="group flex min-h-14 w-full items-center rounded-r-md border text-left shadow-sm transition hover:shadow-md"
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

                <span className="flex min-w-0 flex-1 flex-col gap-1 py-3 pl-10 pr-3 sm:flex-row sm:items-center sm:gap-4 sm:pl-12">
                  <span className="min-w-0 flex-1 break-words text-lg font-bold uppercase tracking-normal text-gray-500 sm:text-xl">
                    {item.title}
                    {item.starred ? " ★" : ""}
                  </span>

                  <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-gray-500 sm:text-base">
                    Lider:
                    <span className="inline-block h-px w-20 bg-gray-500 sm:w-32" />
                  </span>

                  {item.time && (
                    <span className="shrink-0 text-sm font-bold text-gray-500 sm:w-28 sm:text-right sm:text-lg">
                      {item.time}
                    </span>
                  )}

                  <span
                    className={`ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white transition ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    style={{ backgroundColor: activeGroup.color }}
                  >
                    v
                  </span>
                </span>
              </button>

              {isOpen && (
                <div className="ml-3 rounded-b-md border border-t-0 bg-white p-4 sm:ml-6">
                  <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
                    <label className="flex flex-col gap-2 text-sm font-medium text-gray-600">
                      Lider responsable
                      <input
                        type="text"
                        value={itemNotes.leader}
                        onChange={(event) =>
                          updateItem(item.number, "leader", event.target.value)
                        }
                        placeholder="Nombre del lider"
                        className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-lamaSky"
                      />
                    </label>

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
