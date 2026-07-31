"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  formatPlannerDate,
  formatPlannerWeek,
  getPlannerWeek,
  getWeekKey,
} from "@/lib/plannerWeek";

import WeekSelector from "./WeekSelector";

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
  durationMinutes?: number;
  contributions?: Array<{
    leaderId: string;
    detail: string;
  }>;
};

export type SavedMeetingPlanner = {
  id: string;
  group: string;
  groupName?: string | null;
  meetingDate: string;
  selectedDate?: string | null;
  weekStart?: string | null;
  weekEnd?: string | null;
  weekKey?: string | null;
  year?: number | null;
  status?: "draft" | "published";
  items: SavedPlannerItem[];
  createdById: string;
  createdByName: string | null;
  createdAt: string;
  updatedAt?: string;
};

type PlannerDraftItem = {
  leaderId: string;
  detail: string;
  durationMinutes: number;
};

type PlannerNotes = Record<string, Record<number, PlannerDraftItem>>;
type PlannerKey = "general" | string;
type PlannerStatus = "draft" | "published";

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
const defaultDurations: Record<number, number> = {
  1: 0,
  2: 1,
  3: 3,
  4: 15,
  5: 15,
  6: 5,
  7: 10,
  8: 5,
  9: 1,
  10: 0,
};

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

const toInputDate = (value?: string | null) => value?.slice(0, 10) || "";

const getPlannerDateValue = (planner: SavedMeetingPlanner) =>
  toInputDate(
    planner.selectedDate ||
      planner.weekStart ||
      planner.weekKey ||
      planner.meetingDate
  );

const getPlannerWeekKey = (planner: SavedMeetingPlanner) =>
  planner.weekKey || getWeekKey(getPlannerDateValue(planner));

const getDefaultDuration = (itemNumber: number) =>
  defaultDurations[itemNumber] || 0;

const getItemDuration = (item?: SavedPlannerItem) =>
  item && Number.isFinite(Number(item.durationMinutes))
    ? Math.max(0, Math.round(Number(item.durationMinutes)))
    : getDefaultDuration(item?.number || 0);

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

const hasActivityInformation = (item?: SavedPlannerItem) =>
  getContributions(item).some(
    (contribution) => contribution.leaderId || contribution.detail
  );

const isActivityComplete = (item?: SavedPlannerItem) =>
  getContributions(item).some(
    (contribution) => contribution.leaderId && contribution.detail
  );

const getPlannerTimestamp = (planner: SavedMeetingPlanner) =>
  new Date(planner.updatedAt || planner.createdAt).getTime();

const getLatestPlanner = (
  planners: SavedMeetingPlanner[],
  group: string,
  weekKey: string
) =>
  planners
    .filter(
      (planner) =>
        planner.group === group && getPlannerWeekKey(planner) === weekKey
    )
    .sort((left, right) => getPlannerTimestamp(right) - getPlannerTimestamp(left))[0];

const getPlannerSummary = (planner?: SavedMeetingPlanner) => {
  if (!planner) {
    return {
      activities: 0,
      duration: 0,
      leaders: 0,
      pending: 0,
      statusLabel: "Sin planificar",
      statusTone: "empty" as const,
    };
  }

  const leaders = new Set(
    planner.items
      .flatMap((item) => getContributions(item))
      .map((contribution) => contribution.leaderId)
      .filter(Boolean)
  );
  const pending = planner.items.filter((item) => !isActivityComplete(item)).length;
  const persistedStatus = planner.status || "draft";

  return {
    activities: planner.items.length,
    duration: planner.items.reduce(
      (total, item) => total + getItemDuration(item),
      0
    ),
    leaders: leaders.size,
    pending,
    statusLabel:
      persistedStatus === "published"
        ? pending
          ? "Publicado incompleto"
          : "Publicado"
        : pending
          ? "Incompleto"
          : "Borrador",
    statusTone:
      persistedStatus === "published"
        ? pending
          ? ("warning" as const)
          : ("published" as const)
        : pending
          ? ("warning" as const)
          : ("draft" as const),
  };
};

const isErrorStatus = (value: string) =>
  value.includes("No se") ||
  value.includes("Selecciona") ||
  value.includes("error") ||
  value.includes("existe") ||
  value.includes("conectar");

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

const PlannerStateBadge = ({
  label,
  tone,
}: {
  label: string;
  tone: "empty" | "warning" | "draft" | "published";
}) => {
  const toneClass = {
    empty: "bg-[#F1F5F9] text-[#667085] ring-[#D7DEE8]",
    warning: "bg-amber-50 text-amber-800 ring-amber-200",
    draft: "bg-blue-50 text-blue-700 ring-blue-200",
    published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  }[tone];

  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full px-3 text-xs font-black ring-1 ${toneClass}`}
    >
      {label}
    </span>
  );
};

const GroupPlannerSummaryCard = ({
  group,
  planner,
  loading,
  error,
  canEdit,
  onView,
}: {
  group: PlannerGroup;
  planner?: SavedMeetingPlanner;
  loading?: boolean;
  error?: boolean;
  canEdit?: boolean;
  onView: () => void;
}) => {
  if (loading) {
    return (
      <div
        className="min-h-[210px] animate-pulse rounded-[14px] border border-[#E2E8F0] bg-white p-4"
        aria-label={`Cargando planificación de ${group.name}`}
      >
        <div className="h-12 w-12 rounded-xl bg-[#E8EDF3]" />
        <div className="mt-4 h-5 w-32 rounded bg-[#E8EDF3]" />
        <div className="mt-3 h-4 w-full rounded bg-[#EEF2F6]" />
        <div className="mt-2 h-4 w-3/4 rounded bg-[#EEF2F6]" />
      </div>
    );
  }

  const summary = getPlannerSummary(planner);

  return (
    <article
      className="flex min-h-[210px] flex-col rounded-[14px] border border-[#E2E8F0] border-t-4 bg-white p-4"
      style={{ borderTopColor: group.color }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8FAFC]">
          <Image
            src={group.icon}
            alt=""
            width={44}
            height={44}
            className="h-10 w-10 object-contain"
          />
        </span>
        <PlannerStateBadge
          label={error ? "Error al cargar" : summary.statusLabel}
          tone={error ? "warning" : summary.statusTone}
        />
      </div>

      <h3 className="mt-3 text-base font-black text-[#172033]">{group.name}</h3>
      {error ? (
        <p className="mt-2 text-sm leading-6 text-[#667085]">
          No se pudo actualizar este grupo. Los demás datos siguen disponibles.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm font-semibold text-[#344054]">
            {summary.activities} actividades · {summary.duration} min
          </p>
          <p className="mt-1 text-xs leading-5 text-[#667085]">
            {summary.leaders} líderes asignados · {summary.pending} pendientes
          </p>
          <p className="mt-1 text-xs text-[#667085]">
            {planner
              ? `Actualizado ${formatPlannerDate(
                  planner.updatedAt || planner.createdAt
                )}`
              : "Aún no se ha creado un planificador."}
          </p>
        </>
      )}

      <button
        type="button"
        onClick={onView}
        className="mt-auto min-h-11 rounded-xl border border-[#07529A] px-3 text-sm font-black text-[#07529A] transition hover:bg-[#EAF2FA] focus:outline-none focus:ring-4 focus:ring-[#07529A]/10"
      >
        {canEdit
          ? `Editar en el planificador de ${group.name}`
          : "Ver planificación"}
      </button>
    </article>
  );
};

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
  initialPlanners,
}: {
  leaders: LeaderOption[];
  currentRole: "admin" | "teacher";
  initialPlanners: SavedMeetingPlanner[];
}) => {
  const router = useRouter();
  const canManage = currentRole === "teacher" || currentRole === "admin";
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
  const [planners, setPlanners] = useState(initialPlanners);
  const [weekLoading, setWeekLoading] = useState(false);
  const [groupLoadErrors, setGroupLoadErrors] = useState<Record<string, boolean>>({});
  const [weekError, setWeekError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState<PlannerStatus | null>(null);
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
  const selectedWeekKey = getWeekKey(meetingDate);

  const leaderNameById = useMemo(
    () =>
      new Map([
        ...leaders.map((leader) => [leader.id, leader.name] as const),
        [GUEST_LEADER_ID, "Invitado"] as const,
      ]),
    [leaders]
  );

  const filteredPlanners = planners.filter(
    (planner) => planner.group === activeGroupId
  );
  const visibleGroupPlanners = selectedWeekKey
    ? filteredPlanners.filter(
        (planner) => getPlannerWeekKey(planner) === selectedWeekKey
      )
    : filteredPlanners;

  const generalWeeks = useMemo(() => {
    const weeks = new Map<string, Map<string, SavedMeetingPlanner>>();

    planners.forEach((planner) => {
      const dateKey = getPlannerWeekKey(planner);
      const groupPlanners = weeks.get(dateKey) || new Map();
      const currentPlanner = groupPlanners.get(planner.group);

      if (
        !currentPlanner ||
        getPlannerTimestamp(planner) > getPlannerTimestamp(currentPlanner)
      ) {
        groupPlanners.set(planner.group, planner);
      }

      weeks.set(dateKey, groupPlanners);
    });

    return Array.from(weeks.entries())
      .map(([dateKey, groupPlanners]) => [
        dateKey,
        Array.from(groupPlanners.values()),
      ] as const)
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA));
  }, [planners]);

  const groupSummaries = useMemo(
    () =>
      groups.map((group) => ({
        group,
        planner: selectedWeekKey
          ? getLatestPlanner(planners, group.id, selectedWeekKey)
          : undefined,
      })),
    [planners, selectedWeekKey]
  );
  const visibleGeneralWeeks = selectedWeekKey
    ? generalWeeks.filter(([dateKey]) => dateKey === selectedWeekKey)
    : generalWeeks;

  const activeWeekPlanner = selectedWeekKey
    ? getLatestPlanner(planners, plannerKey, selectedWeekKey)
    : undefined;
  const generalTabCount = selectedWeekKey
    ? getPlannerSummary(
        getLatestPlanner(planners, "general", selectedWeekKey)
      ).activities +
      plannerItems.filter((item) =>
        groupSummaries.some(({ planner }) =>
          planner?.items.some((savedItem) => savedItem.number === item.number)
        )
      ).length
    : 0;

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
    setPlanners(initialPlanners);
  }, [initialPlanners]);

  useEffect(() => {
    const queryWeek = new URLSearchParams(window.location.search).get("week");
    const normalizedWeek = getPlannerWeek(queryWeek);
    if (normalizedWeek) setMeetingDate(normalizedWeek.weekStart);
  }, []);

  useEffect(() => {
    if (!selectedWeekKey) return;

    const url = new URL(window.location.href);
    if (url.searchParams.get("week") === selectedWeekKey) return;

    url.searchParams.set("week", selectedWeekKey);
    window.history.replaceState(window.history.state, "", url);
  }, [selectedWeekKey]);

  useEffect(() => {
    if (!selectedWeekKey) {
      setGroupLoadErrors({});
      return;
    }

    const controller = new AbortController();
    const plannerGroupsToLoad = ["general", ...groups.map((group) => group.id)];

    const loadWeek = async () => {
      setWeekLoading(true);
      setGroupLoadErrors({});

      const results = await Promise.allSettled(
        plannerGroupsToLoad.map(async (group) => {
          const response = await fetch(
            `/api/meeting-planners?weekKey=${encodeURIComponent(
              selectedWeekKey
            )}&group=${encodeURIComponent(group)}`,
            { signal: controller.signal }
          );

          if (!response.ok) throw new Error(group);
          const data = await response.json();

          return {
            group,
            planners: Array.isArray(data?.planners)
              ? (data.planners as SavedMeetingPlanner[])
              : [],
          };
        })
      );

      if (controller.signal.aborted) return;

      const successfulGroups = new Set<string>();
      const loadedPlanners: SavedMeetingPlanner[] = [];
      const errors: Record<string, boolean> = {};

      results.forEach((result, index) => {
        const group = plannerGroupsToLoad[index];
        if (result.status === "fulfilled") {
          successfulGroups.add(group);
          loadedPlanners.push(...result.value.planners);
        } else {
          errors[group] = true;
        }
      });

      setPlanners((current) => [
        ...current.filter(
          (planner) =>
            !(
              successfulGroups.has(planner.group) &&
              getPlannerWeekKey(planner) === selectedWeekKey
            )
        ),
        ...loadedPlanners,
      ]);
      setGroupLoadErrors(errors);
      setWeekLoading(false);
    };

    loadWeek().catch(() => {
      if (controller.signal.aborted) return;
      setWeekLoading(false);
      setGroupLoadErrors(
        Object.fromEntries(plannerGroupsToLoad.map((group) => [group, true]))
      );
    });

    return () => controller.abort();
  }, [selectedWeekKey]);

  useEffect(() => {
    if (!selectedWeekKey) {
      setEditingPlannerId(null);
      return;
    }

    setEditingPlannerId(activeWeekPlanner?.id || null);
    setNotes((current) => ({
      ...current,
      [plannerKey]: Object.fromEntries(
        (activeWeekPlanner?.items || []).map((item) => [
          item.number,
          {
            leaderId: item.leaderId || "",
            detail: item.detail || "",
            durationMinutes: getItemDuration(item),
          },
        ])
      ),
    }));
    setItemOrder((current) => ({
      ...current,
      [plannerKey]: mergeOrder(
        (activeWeekPlanner?.items || []).map((item) => item.number),
        plannerKey === "general" ? defaultGeneralOrder : defaultGroupOrder
      ),
    }));
    setOpenItems(
      plannerKey === "general"
        ? {}
        : Object.fromEntries(
            defaultGroupOrder.map((number) => [`${plannerKey}-${number}`, true])
          )
    );
  }, [
    activeWeekPlanner?.id,
    activeWeekPlanner?.items,
    activeWeekPlanner?.updatedAt,
    plannerKey,
    selectedWeekKey,
  ]);

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
    setNotes((current) => ({ ...current, [plannerKey]: {} }));
    setEditingPlannerId(null);
    setOpenItems({});
    setStatus("");
  };

  const updateItem = (
    itemNumber: number,
    patch: Partial<PlannerDraftItem>
  ) => {
    setNotes((current) => ({
      ...current,
      [plannerKey]: {
        ...(current[plannerKey] || {}),
        [itemNumber]: {
          leaderId: current[plannerKey]?.[itemNumber]?.leaderId || "",
          detail: current[plannerKey]?.[itemNumber]?.detail || "",
          durationMinutes:
            current[plannerKey]?.[itemNumber]?.durationMinutes ??
            getDefaultDuration(itemNumber),
          ...patch,
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

  const buildPayload = (nextStatus: PlannerStatus) => {
    const week = getPlannerWeek(meetingDate);

    return {
      id: editingPlannerId || undefined,
      group: plannerKey,
      groupName:
        plannerKey === "general" ? "Reunion general" : activeGroup.name,
      meetingDate,
      selectedDate: week?.selectedDate,
      weekStart: week?.weekStart,
      weekEnd: week?.weekEnd,
      weekKey: week?.weekKey,
      year: week?.year,
      status: nextStatus,
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
          durationMinutes:
            notes[plannerKey]?.[item.number]?.durationMinutes ??
            getDefaultDuration(item.number),
        })),
    };
  };

  const savePlanner = async (nextStatus: PlannerStatus = "draft") => {
    if (!meetingDate) {
      setWeekError("Selecciona la semana de la reunion.");
      setStatus("Selecciona la semana de la reunion.");
      return;
    }

    setWeekError("");
    setSaving(true);
    setSavingStatus(nextStatus);
    setStatus("");

    try {
      const response = await fetch("/api/meeting-planners", {
        method: editingPlannerId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(nextStatus)),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setStatus(data?.message || "No se pudo guardar el planificador.");
        return;
      }

      const savedPlanner = data as SavedMeetingPlanner;
      const savedWeekKey = getPlannerWeekKey(savedPlanner);

      setPlanners((current) => [
        ...current.filter(
          (planner) =>
            planner.id !== savedPlanner.id &&
            !(
              planner.group === savedPlanner.group &&
              getPlannerWeekKey(planner) === savedWeekKey
            )
        ),
        savedPlanner,
      ]);
      setEditingPlannerId(savedPlanner.id || editingPlannerId);
      setOpenItems({});
      setStatus(
        nextStatus === "published"
          ? "Planificador publicado y sincronizado."
          : editingPlannerId
            ? "Borrador actualizado y sincronizado."
            : "Borrador guardado y sincronizado."
      );
      router.refresh();
    } catch {
      setStatus("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
      setSavingStatus(null);
    }
  };

  const editPlanner = (planner: SavedMeetingPlanner) => {
    const nextView = planner.group === "general" ? "general" : "group";
    setActiveView(nextView);
    if (planner.group !== "general") setActiveGroupId(planner.group);
    setMeetingDate(getPlannerDateValue(planner));
    setEditingPlannerId(planner.id);
    setStatus("Editando planificador guardado.");
    setNotes({
      [planner.group]: Object.fromEntries(
        planner.items.map((item) => [
          item.number,
          {
            leaderId: item.leaderId || "",
            detail: item.detail || "",
            durationMinutes: getItemDuration(item),
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
      setPlanners((current) =>
        current.filter((planner) => planner.id !== plannerId)
      );
      setStatus("Planificador eliminado.");
      router.refresh();
    } catch {
      setStatus("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
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

            {canEditCurrent && (
              <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
                <button
                  type="button"
                  onClick={() => savePlanner("draft")}
                  disabled={saving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#07529A] bg-white px-5 text-sm font-black text-[#07529A] transition hover:bg-[#EAF2FA] focus:outline-none focus:ring-4 focus:ring-[#07529A]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingStatus === "draft" && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#07529A]/30 border-t-[#07529A]" />
                  )}
                  {savingStatus === "draft"
                    ? "Guardando..."
                    : "Guardar borrador"}
                </button>
                <button
                  type="button"
                  onClick={() => savePlanner("published")}
                  disabled={saving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#07529A] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#064780] focus:outline-none focus:ring-4 focus:ring-[#07529A]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingStatus === "published" && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                  )}
                  {savingStatus === "published" ? "Publicando..." : "Publicar"}
                </button>
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(260px,410px)_minmax(0,1fr)] lg:items-end">
            <WeekSelector
              id="meeting-week"
              value={meetingDate}
              onChange={(value) => {
                setMeetingDate(value);
                setWeekError("");
                setStatus("");
              }}
              error={weekError}
              disabled={saving}
              loading={false}
              openPicker={openDatePicker}
              setOpenPicker={setOpenDatePicker}
            />

            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Grupos del planificador">
              <button
                type="button"
                role="tab"
                aria-selected={activeView === "general"}
                aria-current={activeView === "general" ? "page" : undefined}
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
                  {weekLoading ? "..." : generalTabCount}
                </span>
              </button>

              {groups.map((group) => {
                const active = activeView === "group" && group.id === activeGroup.id;
                const groupSummary = groupSummaries.find(
                  (summary) => summary.group.id === group.id
                );
                const summary = getPlannerSummary(groupSummary?.planner);
                return (
                  <button
                    key={group.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-current={active ? "page" : undefined}
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
                    <span
                      aria-live="polite"
                      className={`rounded-full px-2 py-0.5 text-[11px] ${active ? "bg-white/20" : "bg-[#F4F7FB]"}`}
                    >
                      {weekLoading ? "..." : summary.activities}
                    </span>
                    {!weekLoading && !groupSummary?.planner && (
                      <span className="text-[10px] font-bold opacity-75">
                        Sin planificar
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {activeView === "general" && (
          <section
            className="rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:p-5"
            aria-labelledby="group-planning-title"
          >
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  id="group-planning-title"
                  className="text-lg font-black text-[#172033]"
                >
                  Planificación de los grupos
                </h2>
                <p className="mt-1 text-sm text-[#667085]">
                  {meetingDate
                    ? formatPlannerWeek(meetingDate)
                    : "Selecciona una semana para consultar los cuatro grupos."}
                </p>
              </div>
              {meetingDate && !weekLoading && (
                <span
                  aria-live="polite"
                  className="text-xs font-bold text-[#667085]"
                >
                  Datos sincronizados
                </span>
              )}
            </div>

            {!meetingDate ? (
              <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-white p-6 text-sm font-semibold text-[#667085]">
                Selecciona la semana de la reunión para cargar la planificación.
              </div>
            ) : (
              <div
                className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
                aria-live="polite"
              >
                {groupSummaries.map(({ group, planner }) => (
                  <GroupPlannerSummaryCard
                    key={group.id}
                    group={group}
                    planner={planner}
                    loading={weekLoading}
                    error={Boolean(groupLoadErrors[group.id])}
                    canEdit={canManage}
                    onView={() => {
                      setActiveView("group");
                      setActiveGroupId(group.id);
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {canEditCurrent && (
          <section
            aria-busy={weekLoading}
            className={`rounded-[14px] border border-[#E2E8F0] bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition sm:p-4 ${
              weekLoading ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-[#172033]">Actividades del programa</h2>
                <p className="text-sm text-[#667085]">
                  {activeView === "group"
                    ? `Selecciona la semana y completa los 4 puntos de ${activeGroup.name}; esta informacion se mostrara en el planificador general de esa semana.`
                    : "Usa subir y bajar para ajustar el orden visual antes de guardar."}
                </p>
              </div>
              <p aria-live="polite" className={`text-sm font-semibold ${isErrorStatus(status) ? "text-red-600" : "text-[#667085]"}`}>
                {weekLoading ? "Cargando planificadores..." : status}
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
                  durationMinutes:
                    notes[plannerKey]?.[item.number]?.durationMinutes ??
                    getDefaultDuration(item.number),
                };
                const complete = isSpecificGeneralItem
                  ? true
                  : Boolean(itemNotes.leaderId && itemNotes.detail);
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
                              const groupPlanner = getLatestPlanner(
                                planners,
                                group.id,
                                selectedWeekKey
                              );
                              const savedItem = groupPlanner?.items.find(
                                (entry) => entry.number === item.number
                              );
                              const hasPlan = hasActivityInformation(savedItem);
                              const openKey = `form-${selectedWeekKey}-${item.number}-${group.id}`;
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
                                updateItem(item.number, {
                                  leaderId: event.target.value,
                                })
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

                      {isSpecificGeneralItem ? (
                        <div className="flex items-center justify-between gap-2 lg:block lg:text-right">
                          <p className="text-xs font-black uppercase tracking-[0.1em] text-[#667085]">
                            Duracion
                          </p>
                          <span className="mt-0 inline-flex min-h-8 items-center rounded-full bg-[#F1F5F9] px-3 text-sm font-black text-[#344054] lg:mt-2">
                            Por grupo
                          </span>
                        </div>
                      ) : (
                        <label className="min-w-0">
                          <span className="mb-2 block text-xs font-black uppercase tracking-[0.1em] text-[#667085]">
                            Duracion
                          </span>
                          <span className="flex min-h-11 items-center rounded-xl border border-[#D7DEE8] bg-white px-2 focus-within:border-[#07529A] focus-within:ring-4 focus-within:ring-[#07529A]/10">
                            <input
                              type="number"
                              min={0}
                              max={240}
                              value={itemNotes.durationMinutes}
                              onChange={(event) =>
                                updateItem(item.number, {
                                  durationMinutes: Math.max(
                                    0,
                                    Number(event.target.value) || 0
                                  ),
                                })
                              }
                              className="min-w-0 flex-1 bg-transparent px-1 text-right text-sm font-black text-[#172033] outline-none"
                              aria-label={`Duracion en minutos de ${item.title}`}
                            />
                            <span className="px-1 text-xs font-bold text-[#667085]">
                              min
                            </span>
                          </span>
                        </label>
                      )}

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
                            onChange={(value) =>
                              updateItem(item.number, { detail: value })
                            }
                            placeholder="Coloca aqui los detalles, instrucciones, materiales necesarios u observaciones."
                          />
                        </label>
                      </div>
                    )}

                    {isSpecificGeneralItem && (
                      <div className="mt-3 flex flex-col gap-2">
                        {groups.map((group) => {
                          const openKey = `form-${selectedWeekKey}-${item.number}-${group.id}`;
                          if (!openGeneralGroup[openKey]) return null;

                          const groupPlanner = getLatestPlanner(
                            planners,
                            group.id,
                            selectedWeekKey
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
                {status || "Programa listo para guardar."}
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
                  onClick={() => savePlanner("draft")}
                  disabled={saving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#07529A] bg-white px-5 text-sm font-black text-[#07529A] transition hover:bg-[#EAF2FA] disabled:opacity-60"
                >
                  {savingStatus === "draft" && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#07529A]/30 border-t-[#07529A]" />
                  )}
                  {savingStatus === "draft" ? "Guardando..." : "Guardar borrador"}
                </button>
                <button
                  type="button"
                  onClick={() => savePlanner("published")}
                  disabled={saving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#07529A] px-5 text-sm font-black text-white transition hover:bg-[#064780] disabled:opacity-60"
                >
                  {savingStatus === "published" && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                  )}
                  {savingStatus === "published" ? "Publicando..." : "Publicar"}
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
                Abre el logo de un grupo para consultar su planificación en cada punto específico.
              </p>
            </div>

            {visibleGeneralWeeks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-6 text-sm font-semibold text-[#667085]">
                {meetingDate
                  ? "No hay planificadores guardados para la semana seleccionada."
                  : "No hay planificadores guardados."}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {visibleGeneralWeeks.map(([dateKey, weekPlanners]) => {
                  const generalPlanner = weekPlanners.find(
                    (planner) => planner.group === "general"
                  );
                  const canEditGeneral = canManageGeneral && Boolean(generalPlanner);
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
                              {formatPlannerWeek(dateKey)}
                            </span>
                            <span className="text-sm font-semibold text-[#667085]">
                              {weekPlanners.length} planificadores guardados
                            </span>
                            {generalPlanner && (
                              <span className="mt-2 block">
                                <PlannerStateBadge
                                  label={getPlannerSummary(generalPlanner).statusLabel}
                                  tone={getPlannerSummary(generalPlanner).statusTone}
                                />
                              </span>
                            )}
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
                                                  <p className="text-[#667085]">Sin planificación para esta semana.</p>
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
                                                        {savedItem && (
                                                          <p className="mt-2 text-xs font-bold text-[#667085]">
                                                            Duracion: {getItemDuration(savedItem)} min
                                                          </p>
                                                        )}
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
                                    {savedItem
                                      ? `${getItemDuration(savedItem)} min`
                                      : item.time || ""}
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

            {visibleGroupPlanners.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-6 text-sm font-semibold text-[#667085]">
                {meetingDate
                  ? `No hay planificación de ${activeGroup.name} para ${formatPlannerWeek(
                      meetingDate,
                      { compact: true }
                    )}.`
                  : "No hay planificadores guardados para este grupo."}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {visibleGroupPlanners.map((planner) => {
                  const open = Boolean(openSaved[planner.id]);
                  const plannerSummary = getPlannerSummary(planner);

                  return (
                    <div key={planner.id} className="overflow-hidden rounded-[14px] border border-[#E2E8F0] bg-white">
                      <div className="flex flex-col gap-3 p-4 transition hover:bg-[#F8FAFC] sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="text-base font-black text-[#172033]">
                            {formatPlannerWeek(getPlannerDateValue(planner))}
                          </h3>
                          <p className="mt-1 text-sm text-[#667085]">
                            {planner.groupName || activeGroup.name} · Creado por{" "}
                            {planner.createdByName || "Lider"} el{" "}
                            {formatPlannerDate(planner.createdAt)}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#667085]">
                            <span>{plannerSummary.activities} actividades</span>
                            <span aria-hidden="true">·</span>
                            <span>{plannerSummary.duration} min</span>
                            <span aria-hidden="true">·</span>
                            <span>{plannerSummary.pending} pendientes</span>
                            <PlannerStateBadge
                              label={plannerSummary.statusLabel}
                              tone={plannerSummary.statusTone}
                            />
                          </div>
                          <p className="mt-2 text-xs text-[#667085]">
                            Última actualización:{" "}
                            {formatPlannerDate(
                              planner.updatedAt || planner.createdAt
                            )}
                          </p>
                          <p className="sr-only">
                            Creado por {planner.createdByName || "Lider"} el{" "}
                            {formatPlannerDate(planner.createdAt)}
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
                                    {getItemDuration(savedItem)} min
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
