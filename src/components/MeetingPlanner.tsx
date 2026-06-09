"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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

export type SavedPlannerItem = {
  number: number;
  leaderId: string;
  detail: string;
};

export type SavedMeetingPlanner = {
  id: string;
  group: string;
  meetingDate: string;
  items: SavedPlannerItem[];
  createdById: string;
  createdByName: string | null;
  createdAt: string;
};

type PlannerNotes = Record<string, Record<number, { leaderId: string; detail: string }>>;

const AutoResizeTextarea = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(textarea.scrollHeight, 180)}px`;
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={1}
      className="min-h-[180px] w-full resize-none overflow-hidden rounded-md border border-gray-300 p-5 text-base leading-7 outline-none focus:border-lamaSky"
    />
  );
};

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

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-PA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));

const toInputDate = (value: string) => value.slice(0, 10);

const MeetingPlanner = ({
  leaders,
  currentRole,
  currentUserId,
  initialPlanners,
}: {
  leaders: LeaderOption[];
  currentRole: "admin" | "teacher";
  currentUserId: string;
  initialPlanners: SavedMeetingPlanner[];
}) => {
  const router = useRouter();
  const canManage = currentRole === "teacher";
  const [activeGroupId, setActiveGroupId] = useState(groups[0].id);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [openSaved, setOpenSaved] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<PlannerNotes>({});
  const [meetingDate, setMeetingDate] = useState("");
  const [editingPlannerId, setEditingPlannerId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const activeGroup = useMemo(
    () => groups.find((group) => group.id === activeGroupId) || groups[0],
    [activeGroupId]
  );

  const leaderNameById = useMemo(
    () => new Map(leaders.map((leader) => [leader.id, leader.name])),
    [leaders]
  );

  const filteredPlanners = initialPlanners.filter(
    (planner) => planner.group === activeGroupId
  );

  const resetForm = () => {
    setMeetingDate("");
    setNotes({});
    setEditingPlannerId(null);
    setOpenItems({});
  };

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

  const buildPayload = () => ({
    id: editingPlannerId || undefined,
    group: activeGroup.id,
    meetingDate,
    items: plannerItems.map((item) => ({
      number: item.number,
      leaderId: notes[activeGroup.id]?.[item.number]?.leaderId || "",
      detail: notes[activeGroup.id]?.[item.number]?.detail || "",
    })),
  });

  const savePlanner = async () => {
    if (!meetingDate) {
      setStatus("Selecciona la fecha de la semana.");
      return;
    }

    setSaving(true);
    setStatus("");

    try {
      const response = await fetch("/api/meeting-planners", {
        method: editingPlannerId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setStatus(data?.message || "No se pudo guardar el planificador.");
        return;
      }

      resetForm();
      setStatus(
        editingPlannerId
          ? "Planificador actualizado."
          : "Planificador guardado. Puedes crear uno nuevo."
      );
      router.refresh();
    } catch {
      setStatus("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  };

  const editPlanner = (planner: SavedMeetingPlanner) => {
    setActiveGroupId(planner.group);
    setMeetingDate(toInputDate(planner.meetingDate));
    setEditingPlannerId(planner.id);
    setStatus("Editando planificador guardado.");
    setNotes({
      [planner.group]: Object.fromEntries(
        planner.items.map((item) => [
          item.number,
          {
            leaderId: item.leaderId || "",
            detail: item.detail || "",
          },
        ])
      ),
    });
  };

  const deletePlanner = async (plannerId: string) => {
    if (!window.confirm("Seguro que quieres eliminar este planificador?")) return;

    setSaving(true);
    setStatus("");

    try {
      const response = await fetch("/api/meeting-planners", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: plannerId }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setStatus(data?.message || "No se pudo eliminar el planificador.");
        return;
      }

      if (editingPlannerId === plannerId) resetForm();
      setStatus("Planificador eliminado.");
      router.refresh();
    } catch {
      setStatus("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
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
              {canManage ? (
                <label className="mt-2 flex max-w-sm items-center gap-2 text-base text-gray-600">
                  <span>Semana:</span>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(event) => setMeetingDate(event.target.value)}
                    className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-lamaSky"
                  />
                </label>
              ) : (
                <p className="mt-2 text-base text-gray-600">
                  Listado de planificadores guardados por grupo.
                </p>
              )}
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

        {canManage && (
          <>
            <div className="flex flex-col gap-4">
              {plannerItems.map((item) => {
                const itemKey = `${activeGroup.id}-${item.number}`;
                const isOpen = Boolean(openItems[itemKey]);
                const itemNotes = {
                  leaderId: notes[activeGroup.id]?.[item.number]?.leaderId || "",
                  detail: notes[activeGroup.id]?.[item.number]?.detail || "",
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
                          Desarrollo
                          <AutoResizeTextarea
                            value={itemNotes.detail}
                            onChange={(value) => updateItem(item.number, "detail", value)}
                            placeholder="Coloca aqui los detalles, instrucciones o materiales necesarios."
                          />
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className={`text-sm ${status.includes("No se") || status.includes("Selecciona") ? "text-red-600" : "text-gray-600"}`}>
                {status}
              </p>
              <div className="flex gap-2">
                {editingPlannerId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600"
                  >
                    Cancelar edicion
                  </button>
                )}
                <button
                  type="button"
                  onClick={savePlanner}
                  disabled={saving}
                  className="rounded-md bg-lamaSky px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving
                    ? "Guardando..."
                    : editingPlannerId
                      ? "Actualizar planificador"
                      : "Guardar planificador"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="rounded-md bg-white p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <Image
            src={activeGroup.icon}
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 object-contain"
          />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Planificadores guardados
            </h2>
            <p className="text-sm text-gray-500">{activeGroup.name}</p>
          </div>
        </div>

        {filteredPlanners.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-300 p-4 text-sm text-gray-500">
            No hay planificadores guardados para este grupo.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredPlanners.map((planner) => {
              const canEditPlanner = canManage && planner.createdById === currentUserId;
              const open = Boolean(openSaved[planner.id]);

              return (
                <div key={planner.id} className="rounded-md border border-gray-200">
                  <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        Semana del {formatDate(planner.meetingDate)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Creado por {planner.createdByName || "Lider"} el{" "}
                        {formatDate(planner.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenSaved((current) => ({
                            ...current,
                            [planner.id]: !current[planner.id],
                          }))
                        }
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-600"
                      >
                        {open ? "Ocultar" : "Ver"}
                      </button>
                      {canEditPlanner && (
                        <>
                          <button
                            type="button"
                            onClick={() => editPlanner(planner)}
                            className="rounded-md border border-lamaSky px-3 py-2 text-sm font-semibold text-lamaSky"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => deletePlanner(planner.id)}
                            disabled={saving}
                            className="rounded-md border border-red-500 px-3 py-2 text-sm font-semibold text-red-600 disabled:opacity-60"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {open && (
                    <div className="border-t border-gray-200 p-4">
                      <div className="grid gap-3">
                        {plannerItems.map((item) => {
                          const savedItem = planner.items.find(
                            (entry) => entry.number === item.number
                          );
                          const leaderName = savedItem?.leaderId
                            ? leaderNameById.get(savedItem.leaderId) || "Lider eliminado"
                            : "Sin lider";

                          return (
                            <div
                              key={item.number}
                              className="grid gap-2 rounded-md bg-gray-50 p-3 md:grid-cols-[56px_minmax(0,1fr)_220px_110px]"
                            >
                              <span className="font-semibold text-gray-500">
                                {item.number}
                              </span>
                              <div>
                                <p className="font-semibold text-gray-700">
                                  {item.title}
                                  {item.starred ? " *" : ""}
                                </p>
                                {savedItem?.detail && (
                                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-500">
                                    {savedItem.detail}
                                  </p>
                                )}
                              </div>
                              <span className="text-sm font-medium text-gray-600">
                                Lider: {leaderName}
                              </span>
                              <span className="text-sm font-semibold text-gray-500 md:text-right">
                                {item.time || ""}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingPlanner;
