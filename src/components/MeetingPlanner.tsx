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
  displayNumber: number;
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
  { number: 4, displayNumber: 1, title: "Estudio biblico", time: "15-20 min." },
  {
    number: 5,
    displayNumber: 2,
    title: "Seccion especial del programa",
    time: "15-25 min.",
  },
  { number: 6, displayNumber: 3, title: "Periodo de ascenso", time: "5-10 min." },
  { number: 7, displayNumber: 4, title: "Recreacion", time: "10-15 min." },
];

const generalItems: PlannerItem[] = [
  { number: 1, displayNumber: 1, title: "Mientras llegan los exploradores" },
  { number: 2, displayNumber: 2, title: "Ceremonia de apertura", time: "1-5 min." },
  {
    number: 3,
    displayNumber: 3,
    title: "Asuntos generales / Rincon de patrulla",
    time: "3-10 min.",
  },
  { number: 8, displayNumber: 8, title: "Devocional", time: "5 min." },
  { number: 9, displayNumber: 9, title: "Ceremonia de clausura", time: "1-5 min." },
  { number: 10, displayNumber: 10, title: "Despues de la reunion" },
];

const orderedGeneralPlannerItems = [
  ...generalItems.slice(0, 3),
  ...plannerItems,
  ...generalItems.slice(3),
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
  currentGroup,
  initialPlanners,
}: {
  leaders: LeaderOption[];
  currentRole: "admin" | "teacher";
  currentUserId: string;
  currentGroup?: string | null;
  initialPlanners: SavedMeetingPlanner[];
}) => {
  const router = useRouter();
  const canManage = currentRole === "teacher";
  const canManageGeneral = currentRole === "admin";
  const [activeView, setActiveView] = useState<"general" | "group">(
    currentRole === "admin" ? "general" : "group"
  );
  const navigationGroups =
    currentRole === "teacher" && currentGroup
      ? groups.filter((group) => group.id === currentGroup)
      : groups;
  const [activeGroupId, setActiveGroupId] = useState(
    navigationGroups[0]?.id || groups[0].id
  );
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [openSaved, setOpenSaved] = useState<Record<string, boolean>>({});
  const [openGeneralGroup, setOpenGeneralGroup] = useState<Record<string, boolean>>({});
  const [openGeneralWeeks, setOpenGeneralWeeks] = useState<Record<string, boolean>>({});
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

  const generalWeeks = useMemo(() => {
    const weeks = new Map<string, SavedMeetingPlanner[]>();

    initialPlanners.forEach((planner) => {
      const dateKey = toInputDate(planner.meetingDate);
      weeks.set(dateKey, [...(weeks.get(dateKey) || []), planner]);
    });

    return Array.from(weeks.entries()).sort(([dateA], [dateB]) =>
      dateB.localeCompare(dateA)
    );
  }, [initialPlanners]);

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
    const plannerKey = activeView === "general" ? "general" : activeGroup.id;

    setNotes((current) => ({
      ...current,
      [plannerKey]: {
        ...(current[plannerKey] || {}),
        [itemNumber]: {
          leaderId: current[plannerKey]?.[itemNumber]?.leaderId || "",
          detail: current[plannerKey]?.[itemNumber]?.detail || "",
          [field]: value,
        },
      },
    }));
  };

  const buildPayload = () => {
    const plannerKey = activeView === "general" ? "general" : activeGroup.id;
    const items = activeView === "general" ? generalItems : plannerItems;

    return {
      id: editingPlannerId || undefined,
      group: plannerKey,
      meetingDate,
      items: items.map((item) => ({
        number: item.number,
        leaderId: notes[plannerKey]?.[item.number]?.leaderId || "",
        detail: notes[plannerKey]?.[item.number]?.detail || "",
      })),
    };
  };

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
    if (planner.group === "general") {
      setActiveView("general");
    } else {
      setActiveView("group");
      setActiveGroupId(planner.group);
    }
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
            {activeView === "group" ? (
              <Image
                src={activeGroup.icon}
                alt={activeGroup.name}
                width={150}
                height={110}
                className="h-24 w-36 object-contain sm:h-28 sm:w-44"
              />
            ) : (
              <div className="grid w-fit grid-cols-2 gap-2">
                {groups.map((group) => (
                  <Image
                    key={group.id}
                    src={group.icon}
                    alt={group.name}
                    width={58}
                    height={58}
                    className="h-12 w-16 object-contain"
                  />
                ))}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                {activeView === "general"
                  ? "Planificador semanal general"
                  : "Planificador de grupo"}
              </h1>
              {(canManage && activeView === "group") ||
              (canManageGeneral && activeView === "general") ? (
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
                  {activeView === "general"
                    ? "Vista conjunta de los momentos compartidos y los puntos especificos de cada grupo."
                    : "Listado de planificadores guardados por grupo."}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            {currentRole === "admin" && (
              <button
                type="button"
                onClick={() => setActiveView("general")}
                className={`col-span-2 rounded-md border px-4 py-2 text-sm font-semibold transition sm:col-span-1 ${
                  activeView === "general"
                    ? "border-lamaSky bg-lamaSky text-white"
                    : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                Reunion general
              </button>
            )}
            {navigationGroups.map((group) => {
              const active = activeView === "group" && group.id === activeGroup.id;

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => {
                    setActiveView("group");
                    setActiveGroupId(group.id);
                  }}
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

        {((canManage && activeView === "group") ||
          (canManageGeneral && activeView === "general")) && (
          <>
            <div className="flex flex-col gap-4">
              {(activeView === "general" ? orderedGeneralPlannerItems : plannerItems).map((item) => {
                const plannerKey = activeView === "general" ? "general" : activeGroup.id;
                const itemKey = `${plannerKey}-${item.number}`;
                const isOpen = Boolean(openItems[itemKey]);
                const isSpecificGeneralItem =
                  activeView === "general" &&
                  plannerItems.some((plannerItem) => plannerItem.number === item.number);
                const itemNotes = {
                  leaderId: notes[plannerKey]?.[item.number]?.leaderId || "",
                  detail: notes[plannerKey]?.[item.number]?.detail || "",
                };
                const rowColor = activeView === "general" ? "#004A92" : activeGroup.color;

                return (
                  <div key={item.number}>
                    <div
                      className="grid min-h-16 w-full grid-cols-[40px_minmax(0,1fr)_36px] items-center gap-3 rounded-md border border-gray-200 border-l-4 bg-white px-3 py-3 text-left transition hover:border-gray-300 sm:grid-cols-[40px_minmax(0,1fr)_310px_90px_36px] sm:px-4"
                      style={{
                        borderLeftColor: rowColor,
                      }}
                    >
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-base font-semibold text-gray-700"
                      >
                        {activeView === "general" ? item.number : item.displayNumber}
                      </span>

                      <span className="min-w-0 break-words text-base font-semibold uppercase tracking-normal text-gray-700 sm:text-lg">
                        {item.title}
                        {item.starred ? " *" : ""}
                      </span>

                      {isSpecificGeneralItem ? (
                        <div className="col-span-3 grid min-w-0 grid-cols-[52px_minmax(0,1fr)] items-center gap-2 sm:col-span-1">
                          <span className="text-sm font-semibold text-gray-500">Grupo:</span>
                          <div className="flex min-h-10 min-w-0 items-center justify-between gap-1 rounded-md border border-gray-300 bg-white px-2 py-1">
                            {groups.map((group) => {
                              const groupPlanner = initialPlanners.find(
                                (planner) =>
                                  planner.group === group.id &&
                                  toInputDate(planner.meetingDate) === meetingDate
                              );
                              const savedItem = groupPlanner?.items.find(
                                (entry) => entry.number === item.number
                              );
                              const hasPlan = Boolean(savedItem?.detail || savedItem?.leaderId);
                              const openKey = `form-${meetingDate}-${item.number}-${group.id}`;
                              const open = Boolean(openGeneralGroup[openKey]);

                              return (
                                <button
                                  key={group.id}
                                  type="button"
                                  onClick={() =>
                                    setOpenGeneralGroup((current) => ({
                                      ...current,
                                      [openKey]: !current[openKey],
                                    }))
                                  }
                                  title={`Ver plan de ${group.name}`}
                                  aria-pressed={open}
                                  className={`flex h-8 min-w-9 flex-1 items-center justify-center rounded p-1 transition hover:bg-gray-100 ${
                                    open ? "bg-gray-100 ring-1 ring-gray-300" : ""
                                  } ${hasPlan ? "" : "opacity-40"}`}
                                >
                                  <Image
                                    src={group.icon}
                                    alt={group.name}
                                    width={38}
                                    height={30}
                                    className="h-7 w-9 object-contain"
                                  />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <label className="col-span-3 grid min-w-0 grid-cols-[52px_minmax(0,1fr)] items-center gap-2 text-sm font-semibold text-gray-500 sm:col-span-1">
                          <span>Lider:</span>
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
                      )}

                      <span className="col-start-2 min-h-5 text-sm font-medium text-gray-500 sm:col-start-auto sm:text-right">
                        {item.time || ""}
                      </span>

                      {!isSpecificGeneralItem && (
                      <button
                        type="button"
                        onClick={() =>
                          setOpenItems((current) => ({
                            ...current,
                            [itemKey]: !current[itemKey],
                          }))
                        }
                        aria-label={isOpen ? "Cerrar detalle" : "Abrir detalle"}
                        className={`col-start-3 row-start-1 ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-50 sm:col-start-auto sm:row-start-auto ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      >
                        <span className="h-2.5 w-2.5 rotate-45 border-b-2 border-r-2 border-current" />
                      </button>
                      )}
                      {isSpecificGeneralItem && <span className="hidden sm:block" />}
                    </div>

                    {!isSpecificGeneralItem && isOpen && (
                      <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-4">
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

                    {isSpecificGeneralItem && (
                      <div className="mt-2 flex flex-col gap-2">
                        {groups.map((group) => {
                          const openKey = `form-${meetingDate}-${item.number}-${group.id}`;
                          if (!openGeneralGroup[openKey]) return null;

                          const groupPlanner = initialPlanners.find(
                            (planner) =>
                              planner.group === group.id &&
                              toInputDate(planner.meetingDate) === meetingDate
                          );
                          const savedItem = groupPlanner?.items.find(
                            (entry) => entry.number === item.number
                          );
                          const leaderName = savedItem?.leaderId
                            ? leaderNameById.get(savedItem.leaderId) || "Lider eliminado"
                            : "Sin lider";

                          return (
                            <div
                              key={group.id}
                              className="rounded-md border border-gray-200 border-l-4 bg-gray-50 p-4 text-sm"
                              style={{
                                borderLeftColor: group.color,
                              }}
                            >
                              <div className="mb-2 flex items-center gap-2 font-semibold text-gray-700">
                                <Image
                                  src={group.icon}
                                  alt=""
                                  width={34}
                                  height={34}
                                  className="h-8 w-9 object-contain"
                                />
                                {group.name} - Lider: {leaderName}
                              </div>
                              <p className="whitespace-pre-wrap text-gray-600">
                                {!meetingDate
                                  ? "Selecciona primero la fecha de la reunion."
                                  : savedItem?.detail ||
                                    "No hay informacion guardada para este punto."}
                              </p>
                            </div>
                          );
                        })}
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

      {activeView === "general" ? (
        <div className="rounded-md bg-white p-4 sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-gray-900">
              Reuniones generales guardadas
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Abre el logo de un grupo para consultar su planificacion en cada punto especifico.
            </p>
          </div>

          {generalWeeks.length === 0 ? (
            <div className="rounded-md border border-dashed border-gray-300 p-4 text-sm text-gray-500">
              No hay planificadores guardados.
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {generalWeeks.map(([dateKey, weekPlanners]) => (
                <section key={dateKey} className="overflow-hidden rounded-md border border-gray-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition hover:bg-gray-50">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenGeneralWeeks((current) => ({
                          ...current,
                          [dateKey]: !current[dateKey],
                        }))
                      }
                      className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                    >
                      <h3 className="text-lg font-semibold text-gray-900">
                        Semana del {formatDate(`${dateKey}T12:00:00.000Z`)}
                      </h3>
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 transition ${
                          openGeneralWeeks[dateKey] ? "rotate-180" : ""
                        }`}
                      >
                        <span className="h-2.5 w-2.5 rotate-45 border-b-2 border-r-2 border-current" />
                      </span>
                    </button>

                    {(() => {
                      const generalPlanner = weekPlanners.find(
                        (planner) => planner.group === "general"
                      );
                      const canEditGeneral =
                        generalPlanner?.createdById === currentUserId;

                      return canEditGeneral && generalPlanner ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => editPlanner(generalPlanner)}
                            className="rounded-md border border-lamaSky px-3 py-2 text-sm font-semibold text-lamaSky"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => deletePlanner(generalPlanner.id)}
                            disabled={saving}
                            className="rounded-md border border-red-500 px-3 py-2 text-sm font-semibold text-red-600 disabled:opacity-60"
                          >
                            Eliminar
                          </button>
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {openGeneralWeeks[dateKey] && (
                  <>
                  <div className="flex flex-col gap-3 border-t border-gray-200 p-4">
                    {generalItems.slice(0, 3).map((item) => (
                      (() => {
                        const generalPlanner = weekPlanners.find(
                          (planner) => planner.group === "general"
                        );
                        const savedItem = generalPlanner?.items.find(
                          (entry) => entry.number === item.number
                        );
                        const leaderName = savedItem?.leaderId
                          ? leaderNameById.get(savedItem.leaderId) || "Lider eliminado"
                          : "Sin lider";

                        return (
                      <div
                        key={item.number}
                        className="grid grid-cols-[40px_minmax(0,1fr)] items-start gap-3 rounded-md border border-gray-200 border-l-4 border-l-[#004A92] bg-white p-3 md:grid-cols-[40px_minmax(0,1fr)_220px_90px] md:items-center"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 font-semibold text-gray-700">
                          {item.number}
                        </span>
                        <div>
                          <span className="font-semibold text-gray-700">{item.title}</span>
                          {savedItem?.detail && (
                            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-500">
                              {savedItem.detail}
                            </p>
                          )}
                        </div>
                        <span className="col-start-2 text-sm font-medium text-gray-600 md:col-start-auto">
                          Lider: {leaderName}
                        </span>
                        <span className="text-right text-sm font-medium text-gray-500">
                          {item.time || ""}
                        </span>
                      </div>
                        );
                      })()
                    ))}
                  </div>

                  <div className="border-y border-gray-200 bg-gray-50 px-4 py-3">
                    <h4 className="font-semibold text-gray-800">Puntos especificos por grupo</h4>
                  </div>

                  <div className="flex flex-col gap-4 p-4">
                    {plannerItems.map((item) => (
                      <div key={item.number} className="rounded-md border border-gray-200 bg-gray-50 p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-base font-semibold text-gray-800">
                            {item.number}. {item.title}
                          </h4>
                          <span className="text-sm font-medium text-gray-500">{item.time}</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                          {groups.map((group) => {
                            const matchingPlanners = weekPlanners.filter(
                              (planner) => planner.group === group.id
                            );
                            const hasDetail = matchingPlanners.some((planner) =>
                              planner.items.some(
                                (savedItem) =>
                                  savedItem.number === item.number && Boolean(savedItem.detail)
                              )
                            );
                            const openKey = `${dateKey}-${item.number}-${group.id}`;
                            const open = Boolean(openGeneralGroup[openKey]);

                            return (
                              <div key={group.id} className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenGeneralGroup((current) => ({
                                      ...current,
                                      [openKey]: !current[openKey],
                                    }))
                                  }
                                  aria-pressed={open}
                                  className={`flex min-h-16 w-full items-center justify-start gap-3 rounded-md border border-gray-200 px-3 py-2 text-left text-sm font-semibold transition hover:border-gray-300 ${
                                    open ? "bg-white shadow-sm" : "bg-white"
                                  } ${hasDetail ? "text-gray-700" : "text-gray-400"}`}
                                >
                                  <Image
                                    src={group.icon}
                                    alt={group.name}
                                    width={62}
                                    height={62}
                                    className={`h-10 w-12 shrink-0 object-contain ${hasDetail ? "" : "opacity-40"}`}
                                  />
                                  <span>{group.name}</span>
                                </button>

                                {open && (
                                  <div
                                    className="mt-2 rounded-md border border-gray-200 border-l-4 bg-white p-3 text-sm"
                                    style={{ borderLeftColor: group.color }}
                                  >
                                    {matchingPlanners.length === 0 ? (
                                      <p className="text-gray-500">Sin planificacion para esta semana.</p>
                                    ) : (
                                      matchingPlanners.map((planner) => {
                                        const savedItem = planner.items.find(
                                          (entry) => entry.number === item.number
                                        );
                                        const leaderName = savedItem?.leaderId
                                          ? leaderNameById.get(savedItem.leaderId) || "Lider eliminado"
                                          : "Sin lider";

                                        return (
                                          <div key={planner.id} className="whitespace-pre-wrap text-gray-700">
                                            <p className="font-semibold">Lider: {leaderName}</p>
                                            <p className="mt-1">
                                              {savedItem?.detail || "Sin informacion registrada."}
                                            </p>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 border-t border-gray-200 p-4">
                    {generalItems.slice(3).map((item) => (
                      (() => {
                        const generalPlanner = weekPlanners.find(
                          (planner) => planner.group === "general"
                        );
                        const savedItem = generalPlanner?.items.find(
                          (entry) => entry.number === item.number
                        );
                        const leaderName = savedItem?.leaderId
                          ? leaderNameById.get(savedItem.leaderId) || "Lider eliminado"
                          : "Sin lider";

                        return (
                      <div
                        key={item.number}
                        className="grid grid-cols-[40px_minmax(0,1fr)] items-start gap-3 rounded-md border border-gray-200 border-l-4 border-l-[#004A92] bg-white p-3 md:grid-cols-[40px_minmax(0,1fr)_180px_90px] md:items-center"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 font-semibold text-gray-700">
                          {item.number}
                        </span>
                        <div>
                          <span className="font-semibold text-gray-700">{item.title}</span>
                          {savedItem?.detail && (
                            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-500">
                              {savedItem.detail}
                            </p>
                          )}
                        </div>
                        <span className="col-start-2 text-sm font-medium text-gray-600 md:col-start-auto">
                          Lider: {leaderName}
                        </span>
                        <span className="text-right text-sm font-medium text-gray-500">
                          {item.time || ""}
                        </span>
                      </div>
                        );
                      })()
                    ))}
                  </div>
                  </>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>
      ) : (
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
              const canEditPlanner = canManage;
              const open = Boolean(openSaved[planner.id]);

              return (
                <div key={planner.id} className="overflow-hidden rounded-md border border-gray-200 bg-white">
                  <div className="flex flex-col gap-3 p-4 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        Semana del {formatDate(planner.meetingDate)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Creado por {planner.createdByName || "Lider"} el{" "}
                        {formatDate(planner.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenSaved((current) => ({
                            ...current,
                            [planner.id]: !current[planner.id],
                          }))
                        }
                        aria-label={open ? "Ocultar planificador" : "Abrir planificador"}
                        className={`flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-50 ${
                          open ? "rotate-180" : ""
                        }`}
                      >
                        <span className="h-2.5 w-2.5 rotate-45 border-b-2 border-r-2 border-current" />
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
                    <div className="border-t border-gray-200 bg-gray-50 p-4">
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
                              className="grid gap-2 rounded-md border border-gray-200 bg-white p-3 md:grid-cols-[44px_minmax(0,1fr)_220px_110px]"
                            >
                              <span className="font-semibold text-gray-500">
                                {item.displayNumber}
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
      )}
    </div>
  );
};

export default MeetingPlanner;
