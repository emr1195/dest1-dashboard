"use client";

import DateTimePicker from "./DateTimePicker";
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
  contributions?: Array<{
    leaderId: string;
    detail: string;
  }>;
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
type PlannerKey = "general" | string;

const GUEST_LEADER_ID = "__guest__";
const primaryBlue = "#07529A";

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

const defaultGeneralOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const defaultGroupOrder = [4, 5, 6, 7];
const allItems = [...generalItems, ...plannerItems];

const getItemByNumber = (number: number) =>
  allItems.find((item) => item.number === number) || allItems[0];

const mergeOrder = (incoming: number[], fallback: number[]) => {
  const validIncoming = incoming.filter(
    (number, index) => fallback.includes(number) && incoming.indexOf(number) === index
  );

  return [
    ...validIncoming,
    ...fallback.filter((number) => !validIncoming.includes(number)),
  ];
};

const pad2 = (value: number) => String(value).padStart(2, "0");

const toInputDate = (value: string) => value.slice(0, 10);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-PA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));

const formatShortDate = (date: Date) =>
  new Intl.DateTimeFormat("es-PA", {
    day: "numeric",
    month: "short",
  }).format(date);

const getWeekRangeLabel = (dateValue: string) => {
  if (!dateValue) return "Selecciona una semana para comenzar";

  const selected = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(selected.getTime())) return "Semana sin fecha valida";

  const monday = new Date(selected);
  const day = (selected.getDay() + 6) % 7;
  monday.setDate(selected.getDate() - day);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return `${formatShortDate(monday)} - ${formatShortDate(sunday)} ${sunday.getFullYear()}`;
};

const getDurationMinutes = (time?: string) => {
  if (!time) return 0;
  const numbers = time.match(/\d+/g)?.map(Number) || [];
  if (!numbers.length) return 0;
  return numbers[numbers.length - 1];
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "L";

const getContributions = (item?: SavedPlannerItem) => {
  if (!item) return [];
  if (item.contributions?.length) return item.contributions;
  return item.leaderId || item.detail
    ? [{ leaderId: item.leaderId, detail: item.detail }]
    : [];
};

const isErrorStatus = (value: string) =>
  value.includes("No se") || value.includes("Selecciona") || value.includes("error");

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
    textarea.style.height = `${Math.max(textarea.scrollHeight, 148)}px`;
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={1}
      className="min-h-[148px] w-full resize-none overflow-hidden rounded-xl border border-[#D7DEE8] bg-white p-4 text-sm leading-7 text-[#172033] outline-none transition focus:border-[#07529A] focus:ring-4 focus:ring-[#07529A]/10"
    />
  );
};

const PlannerContributions = ({
  item,
  leaderNameById,
  emptyText = "Sin informacion registrada.",
}: {
  item?: SavedPlannerItem;
  leaderNameById: Map<string, string>;
  emptyText?: string;
}) => {
  const contributions = getContributions(item);

  if (!contributions.length) {
    return <p className="text-sm text-[#667085]">{emptyText}</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-[#E2E8F0]">
      {contributions.map((contribution, index) => {
        const leaderName = contribution.leaderId
          ? leaderNameById.get(contribution.leaderId) || "Lider eliminado"
          : "Sin lider";

        return (
          <div key={`${contribution.leaderId}-${index}`} className="py-3 first:pt-0 last:pb-0">
            <p className="font-semibold text-[#172033]">Lider: {leaderName}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#667085]">
              {contribution.detail || "Sin informacion registrada."}
            </p>
          </div>
        );
      })}
    </div>
  );
};

const StatusBadge = ({ complete, general }: { complete: boolean; general?: boolean }) => (
  <span
    className={`inline-flex min-h-7 items-center rounded-full px-3 text-xs font-bold ${
      complete
        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
        : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
    }`}
  >
    {complete ? "Completo" : general ? "Pendiente" : "Sin lider"}
  </span>
);

const IconButton = ({
  label,
  onClick,
  children,
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D7DEE8] bg-white text-[#344054] transition hover:bg-[#F4F7FB] focus:outline-none focus:ring-4 focus:ring-[#07529A]/10 disabled:cursor-not-allowed disabled:opacity-40"
  >
    {children}
  </button>
);

const Chevron = ({ open }: { open: boolean }) => (
  <span
    className={`h-2.5 w-2.5 rotate-45 border-b-2 border-r-2 border-current transition ${
      open ? "rotate-[225deg]" : ""
    }`}
  />
);

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
  const canManageGeneral = currentRole === "admin";
  const [activeView, setActiveView] = useState<"general" | "group">(
    currentRole === "admin" ? "general" : "group"
  );
  const [activeGroupId, setActiveGroupId] = useState(groups[0].id);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [openSaved, setOpenSaved] = useState<Record<string, boolean>>({});
  const [openGeneralGroup, setOpenGeneralGroup] = useState<Record<string, boolean>>({});
  const [openGeneralWeeks, setOpenGeneralWeeks] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<PlannerNotes>({});
  const [meetingDate, setMeetingDate] = useState("");
  const [openDatePicker, setOpenDatePicker] = useState<string | null>(null);
  const [editingPlannerId, setEditingPlannerId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [draggingItem, setDraggingItem] = useState<number | null>(null);
  const [itemOrder, setItemOrder] = useState<Record<PlannerKey, number[]>>({
    general: defaultGeneralOrder,
    navegantes: defaultGroupOrder,
    pioneros: defaultGroupOrder,
    seguidores: defaultGroupOrder,
    exploradores: defaultGroupOrder,
  });

  const activeGroup = useMemo(
    () => groups.find((group) => group.id === activeGroupId) || groups[0],
    [activeGroupId]
  );
  const plannerKey = activeView === "general" ? "general" : activeGroup.id;
  const activeOrder = itemOrder[plannerKey] || defaultGroupOrder;
  const activeItems = activeOrder.map(getItemByNumber);
  const canEditCurrent = (canManage && activeView === "group") || (canManageGeneral && activeView === "general");

  const leaderNameById = useMemo(
    () =>
      new Map([
        ...leaders.map((leader) => [leader.id, leader.name] as const),
        [GUEST_LEADER_ID, "Invitado"] as const,
      ]),
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

  const summary = useMemo(() => {
    const editableItems = activeItems.filter(
      (item) => activeView !== "general" || !plannerItems.some((plannerItem) => plannerItem.number === item.number)
    );
    const completed = editableItems.filter((item) => {
      const itemNotes = notes[plannerKey]?.[item.number];
      return Boolean(itemNotes?.leaderId || itemNotes?.detail);
    });
    const assignedLeaderIds = new Set(
      completed.map((item) => notes[plannerKey]?.[item.number]?.leaderId).filter(Boolean)
    );

    return {
      totalActivities: activeItems.length,
      editableActivities: editableItems.length,
      duration: activeItems.reduce((total, item) => total + getDurationMinutes(item.time), 0),
      assignedLeaders: assignedLeaderIds.size,
      pending: Math.max(0, editableItems.length - completed.length),
      groups: activeView === "general" ? groups.length : 1,
    };
  }, [activeItems, activeView, notes, plannerKey]);

  const hasDraftChanges = useMemo(
    () =>
      Boolean(
        meetingDate ||
          editingPlannerId ||
          Object.values(notes).some((items) =>
            Object.values(items).some((item) => item.leaderId || item.detail)
          )
      ),
    [editingPlannerId, meetingDate, notes]
  );

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasDraftChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasDraftChanges]);

  const resetForm = () => {
    setMeetingDate("");
    setNotes({});
    setEditingPlannerId(null);
    setOpenItems({});
    setStatus("");
  };

  const updateItem = (
    itemNumber: number,
    field: "leaderId" | "detail",
    value: string
  ) => {
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

  const moveItem = (itemNumber: number, direction: -1 | 1) => {
    setItemOrder((current) => {
      const order = [...(current[plannerKey] || activeOrder)];
      const index = order.indexOf(itemNumber);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= order.length) return current;

      [order[index], order[nextIndex]] = [order[nextIndex], order[index]];
      return { ...current, [plannerKey]: order };
    });
  };

  const moveItemTo = (itemNumber: number, targetNumber: number) => {
    if (itemNumber === targetNumber) return;

    setItemOrder((current) => {
      const order = [...(current[plannerKey] || activeOrder)];
      const fromIndex = order.indexOf(itemNumber);
      const toIndex = order.indexOf(targetNumber);
      if (fromIndex < 0 || toIndex < 0) return current;

      const [moved] = order.splice(fromIndex, 1);
      order.splice(toIndex, 0, moved);
      return { ...current, [plannerKey]: order };
    });
  };

  const buildPayload = () => ({
    id: editingPlannerId || undefined,
    group: plannerKey,
    meetingDate,
    items: activeItems
      .filter((item) =>
        plannerKey === "general"
          ? generalItems.some((generalItem) => generalItem.number === item.number)
          : plannerItems.some((plannerItem) => plannerItem.number === item.number)
      )
      .map((item) => ({
        number: item.number,
        leaderId: notes[plannerKey]?.[item.number]?.leaderId || "",
        detail: notes[plannerKey]?.[item.number]?.detail || "",
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
    const nextView = planner.group === "general" ? "general" : "group";
    setActiveView(nextView);
    if (planner.group !== "general") setActiveGroupId(planner.group);
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
    if (planner.items.length) {
      setItemOrder((current) => ({
        ...current,
        [planner.group]: mergeOrder(
          planner.items.map((item) => item.number),
          planner.group === "general" ? defaultGeneralOrder : defaultGroupOrder
        ),
      }));
    }
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

  const openAllEditable = () => {
    const nextOpen: Record<string, boolean> = {};
    activeItems.forEach((item) => {
      const isSpecificGeneralItem =
        activeView === "general" &&
        plannerItems.some((plannerItem) => plannerItem.number === item.number);
      if (!isSpecificGeneralItem) nextOpen[`${plannerKey}-${item.number}`] = true;
    });
    setOpenItems((current) => ({ ...current, ...nextOpen }));
    setStatus("Vista previa preparada.");
  };

  const duplicateDraft = () => {
    setEditingPlannerId(null);
    setStatus("Semana duplicada en borrador. Elige otra fecha y guarda.");
  };

  return (
    <main className="min-h-screen bg-[#F5F7FA] px-2 py-3 text-[#172033] sm:px-4 sm:py-5">
      <section className="mx-auto flex w-full max-w-[1500px] flex-col gap-5">
        <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex shrink-0 flex-wrap gap-2 sm:w-28">
                {(activeView === "group" ? [activeGroup] : groups).map((group) => (
                  <span
                    key={group.id}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]"
                  >
                    <Image
                      src={group.icon}
                      alt={group.name}
                      width={42}
                      height={42}
                      className="h-10 w-10 object-contain"
                    />
                  </span>
                ))}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#07529A]">
                  Programa semanal
                </p>
                <h1 className="mt-1 text-2xl font-black leading-tight text-[#172033] sm:text-3xl">
                  {activeView === "general"
                    ? "Planificador semanal general"
                    : `Planificador de ${activeGroup.name}`}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">
                  Organiza las actividades, lideres y tiempos de la reunion.
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <button
                type="button"
                onClick={openAllEditable}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D7DEE8] bg-white px-4 text-sm font-bold text-[#344054] transition hover:bg-[#F4F7FB] focus:outline-none focus:ring-4 focus:ring-[#07529A]/10"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                  <rect x="4" y="5" width="16" height="14" rx="2" />
                  <path d="M8 9h8" />
                  <path d="M8 13h5" />
                </svg>
                Vista previa
              </button>
              <button
                type="button"
                onClick={duplicateDraft}
                disabled={!hasDraftChanges}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D7DEE8] bg-white px-4 text-sm font-bold text-[#344054] transition hover:bg-[#F4F7FB] focus:outline-none focus:ring-4 focus:ring-[#07529A]/10 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span aria-hidden="true">+</span>
                Duplicar semana
              </button>
              <button
                type="button"
                onClick={savePlanner}
                disabled={saving || !canEditCurrent}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#07529A] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#064780] focus:outline-none focus:ring-4 focus:ring-[#07529A]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                )}
                {saving
                  ? "Guardando..."
                  : editingPlannerId
                    ? "Guardar cambios"
                    : "Guardar borrador"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(260px,410px)_minmax(0,1fr)] lg:items-end">
            {canEditCurrent ? (
              <div>
                <DateTimePicker
                  id="meeting-date"
                  label="Semana"
                  value={meetingDate}
                  onChange={setMeetingDate}
                  dateOnly
                  placeholder="Seleccionar semana"
                  openPicker={openDatePicker}
                  setOpenPicker={setOpenDatePicker}
                />
                <p className="mt-2 text-sm font-semibold text-[#667085]">
                  {getWeekRangeLabel(meetingDate)}
                </p>
              </div>
            ) : (
              <p className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm text-[#667085]">
                {activeView === "general"
                  ? "Vista conjunta de los momentos compartidos y los puntos especificos de cada grupo."
                  : "Listado de planificadores guardados por grupo."}
              </p>
            )}

            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Grupos del planificador">
              <button
                type="button"
                role="tab"
                aria-selected={activeView === "general"}
                onClick={() => setActiveView("general")}
                className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-[#07529A]/10 ${
                  activeView === "general"
                    ? "border-[#07529A] bg-[#07529A] text-white"
                    : "border-[#D7DEE8] bg-white text-[#344054] hover:bg-[#F4F7FB]"
                }`}
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">
                  G
                </span>
                Reunion general
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px]">
                  {defaultGeneralOrder.length}
                </span>
              </button>

              {groups.map((group) => {
                const active = activeView === "group" && group.id === activeGroup.id;
                return (
                  <button
                    key={group.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setActiveView("group");
                      setActiveGroupId(group.id);
                    }}
                    className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-[#07529A]/10 ${
                      active ? "text-white" : "bg-white text-[#344054] hover:bg-[#F4F7FB]"
                    }`}
                    style={{
                      borderColor: group.color,
                      backgroundColor: active ? group.color : undefined,
                    }}
                  >
                    <Image
                      src={group.icon}
                      alt=""
                      width={28}
                      height={28}
                      className="h-7 w-7 object-contain"
                    />
                    {group.name}
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${active ? "bg-white/20" : "bg-[#F4F7FB]"}`}>
                      {defaultGroupOrder.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-4">
            {[
              `${summary.totalActivities} actividades`,
              `${summary.duration} min programados`,
              `${summary.assignedLeaders} lideres asignados`,
              `${summary.pending} pendientes`,
            ].map((label) => (
              <div key={label} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#344054]">
                {label}
              </div>
            ))}
          </div>

          {summary.pending > 0 && canEditCurrent && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900" role="status">
              Faltan lideres o detalles por completar en {summary.pending} actividades.
            </div>
          )}
        </div>

        {canEditCurrent && (
          <section className="rounded-[14px] border border-[#E2E8F0] bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-4">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-[#172033]">Actividades del programa</h2>
                <p className="text-sm text-[#667085]">
                  Usa subir y bajar para ajustar el orden visual antes de guardar.
                </p>
              </div>
              <p aria-live="polite" className={`text-sm font-semibold ${isErrorStatus(status) ? "text-red-600" : "text-[#667085]"}`}>
                {status}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {activeItems.map((item, index) => {
                const itemKey = `${plannerKey}-${item.number}`;
                const isOpen = Boolean(openItems[itemKey]);
                const isSpecificGeneralItem =
                  activeView === "general" &&
                  plannerItems.some((plannerItem) => plannerItem.number === item.number);
                const itemNotes = {
                  leaderId: notes[plannerKey]?.[item.number]?.leaderId || "",
                  detail: notes[plannerKey]?.[item.number]?.detail || "",
                };
                const complete = isSpecificGeneralItem
                  ? true
                  : Boolean(itemNotes.leaderId || itemNotes.detail);
                const selectedLeader = itemNotes.leaderId
                  ? leaderNameById.get(itemNotes.leaderId) || "Lider eliminado"
                  : "";
                const rowColor = activeView === "general" ? primaryBlue : activeGroup.color;

                return (
                  <article
                    key={item.number}
                    draggable
                    onDragStart={() => setDraggingItem(item.number)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (draggingItem) moveItemTo(draggingItem, item.number);
                      setDraggingItem(null);
                    }}
                    onDragEnd={() => setDraggingItem(null)}
                    className={`rounded-[14px] border border-[#E2E8F0] border-l-4 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.035)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.07)] ${
                      draggingItem === item.number ? "opacity-55 ring-4 ring-[#07529A]/10" : ""
                    }`}
                    style={{ borderLeftColor: rowColor }}
                  >
                    <div className="grid gap-4 lg:grid-cols-[36px_52px_minmax(0,1fr)_minmax(250px,320px)_120px_44px] lg:items-center">
                      <div className="flex items-center gap-2 lg:flex-col">
                        <span className="flex h-9 w-9 cursor-grab items-center justify-center rounded-xl text-[#667085] active:cursor-grabbing" aria-label="Arrastrar">
                          ::
                        </span>
                      </div>

                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F1F5F9] text-sm font-black text-[#172033]">
                        {pad2(index + 1)}
                      </span>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-base font-black uppercase text-[#172033]">
                            {item.title}
                            {item.starred ? " *" : ""}
                          </h3>
                          <StatusBadge complete={complete} general={isSpecificGeneralItem} />
                        </div>
                        <p className="mt-1 text-sm text-[#667085]">
                          {isSpecificGeneralItem
                            ? "Punto especifico por grupo participante."
                            : itemNotes.detail
                              ? "Detalles listos para revisar."
                              : "Agrega lider, desarrollo u observaciones."}
                        </p>
                      </div>

                      {isSpecificGeneralItem ? (
                        <div>
                          <p className="mb-2 text-xs font-black uppercase tracking-[0.1em] text-[#667085]">
                            Grupos
                          </p>
                          <div className="grid grid-cols-2 gap-2">
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
                                  aria-pressed={open}
                                  className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-2 text-xs font-bold transition hover:bg-[#F8FAFC] focus:outline-none focus:ring-4 focus:ring-[#07529A]/10 ${
                                    open ? "bg-[#F8FAFC] ring-1 ring-[#CBD5E1]" : "bg-white"
                                  } ${hasPlan ? "text-[#172033]" : "text-[#98A2B3]"}`}
                                >
                                  <Image
                                    src={group.icon}
                                    alt=""
                                    width={24}
                                    height={24}
                                    className={`h-6 w-6 object-contain ${hasPlan ? "" : "opacity-45"}`}
                                  />
                                  {group.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <label className="min-w-0">
                          <span className="mb-2 block text-xs font-black uppercase tracking-[0.1em] text-[#667085]">
                            Lider
                          </span>
                          <span className="flex min-h-11 items-center gap-2 rounded-xl border border-[#D7DEE8] bg-white px-3 transition focus-within:border-[#07529A] focus-within:ring-4 focus-within:ring-[#07529A]/10">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E6EEF7] text-xs font-black text-[#07529A]">
                              {selectedLeader ? getInitials(selectedLeader) : "?"}
                            </span>
                            <select
                              value={itemNotes.leaderId}
                              onChange={(event) =>
                                updateItem(item.number, "leaderId", event.target.value)
                              }
                              className="min-w-0 flex-1 bg-transparent py-2 text-sm font-semibold text-[#172033] outline-none"
                            >
                              <option value="">Seleccionar lider</option>
                              {activeView === "general" && (
                                <option value={GUEST_LEADER_ID}>Invitado</option>
                              )}
                              {leaders.map((leader) => (
                                <option key={leader.id} value={leader.id}>
                                  {leader.name}
                                </option>
                              ))}
                            </select>
                          </span>
                        </label>
                      )}

                      <div className="flex items-center justify-between gap-2 lg:block lg:text-right">
                        <p className="text-xs font-black uppercase tracking-[0.1em] text-[#667085]">
                          Duracion
                        </p>
                        <span className="mt-0 inline-flex min-h-8 items-center rounded-full bg-[#F1F5F9] px-3 text-sm font-black text-[#344054] lg:mt-2">
                          {item.time || "Sin tiempo"}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <IconButton
                          label="Subir actividad"
                          onClick={() => moveItem(item.number, -1)}
                          disabled={index === 0}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                            <path d="m12 5-6 6" />
                            <path d="m12 5 6 6" />
                            <path d="M12 19V5" />
                          </svg>
                        </IconButton>
                        <IconButton
                          label="Bajar actividad"
                          onClick={() => moveItem(item.number, 1)}
                          disabled={index === activeItems.length - 1}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                            <path d="M12 5v14" />
                            <path d="m18 13-6 6" />
                            <path d="m6 13 6 6" />
                          </svg>
                        </IconButton>
                        {!isSpecificGeneralItem && (
                          <IconButton
                            label={isOpen ? "Cerrar detalle" : "Abrir detalle"}
                            onClick={() =>
                              setOpenItems((current) => ({
                                ...current,
                                [itemKey]: !current[itemKey],
                              }))
                            }
                          >
                            <Chevron open={isOpen} />
                          </IconButton>
                        )}
                      </div>
                    </div>

                    {!isSpecificGeneralItem && isOpen && (
                      <div id={`${itemKey}-details`} className="mt-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                        <label className="flex flex-col gap-2 text-sm font-bold text-[#344054]">
                          Desarrollo, materiales y observaciones
                          <AutoResizeTextarea
                            value={itemNotes.detail}
                            onChange={(value) => updateItem(item.number, "detail", value)}
                            placeholder="Coloca aqui los detalles, instrucciones, materiales necesarios u observaciones."
                          />
                        </label>
                      </div>
                    )}

                    {isSpecificGeneralItem && (
                      <div className="mt-3 flex flex-col gap-2">
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

                          return (
                            <div
                              key={group.id}
                              className="rounded-xl border border-[#E2E8F0] border-l-4 bg-[#F8FAFC] p-4 text-sm"
                              style={{ borderLeftColor: group.color }}
                            >
                              <div className="mb-2 flex items-center gap-2 font-black text-[#172033]">
                                <Image
                                  src={group.icon}
                                  alt=""
                                  width={34}
                                  height={34}
                                  className="h-8 w-9 object-contain"
                                />
                                {group.name}
                              </div>
                              {!meetingDate ? (
                                <p className="text-[#667085]">
                                  Selecciona primero la fecha de la reunion.
                                </p>
                              ) : (
                                <PlannerContributions
                                  item={savedItem}
                                  leaderNameById={leaderNameById}
                                  emptyText="No hay informacion guardada para este punto."
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-[#E2E8F0] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p aria-live="polite" className={`text-sm font-semibold ${isErrorStatus(status) ? "text-red-600" : "text-[#667085]"}`}>
                {status || (summary.pending ? "Programa en borrador." : "Programa listo para guardar.")}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                {editingPlannerId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="min-h-11 rounded-xl border border-[#D7DEE8] px-4 text-sm font-bold text-[#344054] transition hover:bg-[#F4F7FB]"
                  >
                    Cancelar edicion
                  </button>
                )}
                <button
                  type="button"
                  onClick={savePlanner}
                  disabled={saving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#07529A] px-5 text-sm font-black text-white transition hover:bg-[#064780] disabled:opacity-60"
                >
                  {saving && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                  )}
                  {saving
                    ? "Guardando..."
                    : editingPlannerId
                      ? "Actualizar planificador"
                      : "Guardar planificador"}
                </button>
              </div>
            </div>
          </section>
        )}

        {activeView === "general" ? (
          <section className="rounded-[14px] border border-[#E2E8F0] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-5">
            <div className="mb-5">
              <h2 className="text-xl font-black text-[#172033]">Reuniones generales guardadas</h2>
              <p className="mt-1 text-sm text-[#667085]">
                Abre el logo de un grupo para consultar su planificacion en cada punto especifico.
              </p>
            </div>

            {generalWeeks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-6 text-sm font-semibold text-[#667085]">
                No hay planificadores guardados.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {generalWeeks.map(([dateKey, weekPlanners]) => {
                  const generalPlanner = weekPlanners.find(
                    (planner) => planner.group === "general"
                  );
                  const canEditGeneral = generalPlanner?.createdById === currentUserId;
                  const open = Boolean(openGeneralWeeks[dateKey]);

                  return (
                    <section key={dateKey} className="overflow-hidden rounded-[14px] border border-[#E2E8F0] bg-white">
                      <div className="flex flex-col gap-3 p-4 transition hover:bg-[#F8FAFC] sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenGeneralWeeks((current) => ({
                              ...current,
                              [dateKey]: !current[dateKey],
                            }))
                          }
                          aria-expanded={open}
                          className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                        >
                          <span>
                            <span className="block text-lg font-black text-[#172033]">
                              Semana del {formatDate(`${dateKey}T12:00:00`)}
                            </span>
                            <span className="text-sm font-semibold text-[#667085]">
                              {weekPlanners.length} planificadores guardados
                            </span>
                          </span>
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D7DEE8] bg-white text-[#344054]">
                            <Chevron open={open} />
                          </span>
                        </button>

                        {canEditGeneral && generalPlanner && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => editPlanner(generalPlanner)}
                              className="min-h-10 rounded-xl border border-[#07529A] px-3 text-sm font-bold text-[#07529A]"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => deletePlanner(generalPlanner.id)}
                              disabled={saving}
                              className="min-h-10 rounded-xl border border-red-300 px-3 text-sm font-bold text-red-700 disabled:opacity-60"
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>

                      {open && (
                        <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] p-4">
                          <div className="grid gap-3">
                            {defaultGeneralOrder.map((number) => {
                              const item = getItemByNumber(number);
                              const isSpecific = plannerItems.some((plannerItem) => plannerItem.number === item.number);

                              if (isSpecific) {
                                return (
                                  <div key={item.number} className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                      <h4 className="font-black text-[#172033]">
                                        {item.number}. {item.title}
                                      </h4>
                                      <span className="text-sm font-bold text-[#667085]">{item.time}</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                                      {groups.map((group) => {
                                        const matchingPlanners = weekPlanners.filter(
                                          (planner) => planner.group === group.id
                                        );
                                        const hasDetail = matchingPlanners.some((planner) =>
                                          planner.items.some(
                                            (savedItem) =>
                                              savedItem.number === item.number &&
                                              getContributions(savedItem).some(
                                                (contribution) => Boolean(contribution.detail || contribution.leaderId)
                                              )
                                          )
                                        );
                                        const openKey = `${dateKey}-${item.number}-${group.id}`;
                                        const groupOpen = Boolean(openGeneralGroup[openKey]);

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
                                              aria-pressed={groupOpen}
                                              className={`flex min-h-14 w-full items-center justify-start gap-3 rounded-xl border border-[#E2E8F0] px-3 py-2 text-left text-sm font-bold transition hover:border-[#CBD5E1] ${
                                                groupOpen ? "bg-[#F8FAFC] shadow-sm" : "bg-white"
                                              } ${hasDetail ? "text-[#172033]" : "text-[#98A2B3]"}`}
                                            >
                                              <Image
                                                src={group.icon}
                                                alt=""
                                                width={42}
                                                height={42}
                                                className={`h-9 w-10 shrink-0 object-contain ${hasDetail ? "" : "opacity-40"}`}
                                              />
                                              {group.name}
                                            </button>

                                            {groupOpen && (
                                              <div
                                                className="mt-2 rounded-xl border border-[#E2E8F0] border-l-4 bg-white p-3 text-sm"
                                                style={{ borderLeftColor: group.color }}
                                              >
                                                {matchingPlanners.length === 0 ? (
                                                  <p className="text-[#667085]">Sin planificacion para esta semana.</p>
                                                ) : (
                                                  matchingPlanners.map((planner) => {
                                                    const savedItem = planner.items.find(
                                                      (entry) => entry.number === item.number
                                                    );
                                                    return (
                                                      <div key={planner.id} className="text-[#172033]">
                                                        <PlannerContributions
                                                          item={savedItem}
                                                          leaderNameById={leaderNameById}
                                                        />
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
                                );
                              }

                              const savedItem = generalPlanner?.items.find(
                                (entry) => entry.number === item.number
                              );
                              const leaderName = savedItem?.leaderId
                                ? leaderNameById.get(savedItem.leaderId) || "Lider eliminado"
                                : "Sin lider";

                              return (
                                <div
                                  key={item.number}
                                  className="grid grid-cols-[44px_minmax(0,1fr)] items-start gap-3 rounded-xl border border-[#E2E8F0] border-l-4 border-l-[#07529A] bg-white p-4 md:grid-cols-[44px_minmax(0,1fr)_220px_100px] md:items-center"
                                >
                                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1F5F9] font-black text-[#172033]">
                                    {item.number}
                                  </span>
                                  <div>
                                    <span className="font-black text-[#172033]">{item.title}</span>
                                    {savedItem?.detail && (
                                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#667085]">
                                        {savedItem.detail}
                                      </p>
                                    )}
                                  </div>
                                  <span className="col-start-2 text-sm font-bold text-[#344054] md:col-start-auto">
                                    Lider: {leaderName}
                                  </span>
                                  <span className="text-sm font-bold text-[#667085] md:text-right">
                                    {item.time || ""}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <section className="rounded-[14px] border border-[#E2E8F0] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-5">
            <div className="mb-5 flex items-center gap-3">
              <span className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2">
                <Image
                  src={activeGroup.icon}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 object-contain"
                />
              </span>
              <div>
                <h2 className="text-xl font-black text-[#172033]">Planificadores guardados</h2>
                <p className="text-sm font-semibold text-[#667085]">{activeGroup.name}</p>
              </div>
            </div>

            {filteredPlanners.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-6 text-sm font-semibold text-[#667085]">
                No hay planificadores guardados para este grupo.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredPlanners.map((planner) => {
                  const open = Boolean(openSaved[planner.id]);

                  return (
                    <div key={planner.id} className="overflow-hidden rounded-[14px] border border-[#E2E8F0] bg-white">
                      <div className="flex flex-col gap-3 p-4 transition hover:bg-[#F8FAFC] sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-base font-black text-[#172033]">
                            Semana del {formatDate(planner.meetingDate)}
                          </h3>
                          <p className="text-sm text-[#667085]">
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
                            aria-expanded={open}
                            aria-label={open ? "Ocultar planificador" : "Abrir planificador"}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D7DEE8] bg-white text-[#344054] transition hover:bg-[#F4F7FB]"
                          >
                            <Chevron open={open} />
                          </button>
                          {canManage && (
                            <>
                              <button
                                type="button"
                                onClick={() => editPlanner(planner)}
                                className="min-h-10 rounded-xl border border-[#07529A] px-3 text-sm font-bold text-[#07529A]"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => deletePlanner(planner.id)}
                                disabled={saving}
                                className="min-h-10 rounded-xl border border-red-300 px-3 text-sm font-bold text-red-700 disabled:opacity-60"
                              >
                                Eliminar
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {open && (
                        <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] p-4">
                          <div className="grid gap-3">
                            {(planner.items.length ? planner.items.map((entry) => getItemByNumber(entry.number)) : plannerItems).map((item, index) => {
                              const savedItem = planner.items.find(
                                (entry) => entry.number === item.number
                              );
                              return (
                                <div
                                  key={item.number}
                                  className="grid gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 md:grid-cols-[44px_minmax(0,1fr)_110px]"
                                >
                                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1F5F9] font-black text-[#172033]">
                                    {pad2(index + 1)}
                                  </span>
                                  <div>
                                    <p className="font-black text-[#172033]">
                                      {item.title}
                                      {item.starred ? " *" : ""}
                                    </p>
                                    <div className="mt-2 text-sm">
                                      <PlannerContributions
                                        item={savedItem}
                                        leaderNameById={leaderNameById}
                                      />
                                    </div>
                                  </div>
                                  <span className="text-sm font-bold text-[#667085] md:text-right">
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
          </section>
        )}
      </section>
    </main>
  );
};

export default MeetingPlanner;
