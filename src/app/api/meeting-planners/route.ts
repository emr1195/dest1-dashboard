import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth";
import {
  addDaysToDateKey,
  getPlannerWeek,
} from "@/lib/plannerWeek";
import prisma from "@/lib/prisma";
import { dateKeyToUtcDate } from "@/lib/timeZone";

const plannerGroups = ["navegantes", "pioneros", "seguidores", "exploradores"];
// Los planificadores de grupo solo contienen los cuatro momentos especificos.
// Se conservan sus numeros historicos para que los planes guardados sigan siendo compatibles.
const groupPlannerItemNumbers = [4, 5, 6, 7];
const generalPlannerItemNumbers = [1, 2, 3, 8, 9, 10];
const groupNames: Record<string, string> = {
  general: "Reunion general",
  navegantes: "Navegantes",
  pioneros: "Pioneros",
  seguidores: "Seguidores",
  exploradores: "Exploradores",
};
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

class PlannerUserError extends Error {}

const getPlannerErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof PlannerUserError) return error.message;

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "Ya existe un planificador de este grupo para la semana seleccionada.";
  }

  return fallback;
};

type PlannerItemPayload = {
  number: number;
  leaderId: string;
  detail: string;
  durationMinutes: number;
  contributions?: PlannerContribution[];
};

type PlannerContribution = {
  leaderId: string;
  detail: string;
};

const normalizeContributions = (item: any): PlannerContribution[] => {
  const contributions = Array.isArray(item?.contributions)
    ? item.contributions
        .map((contribution: any) => ({
          leaderId:
            typeof contribution?.leaderId === "string"
              ? contribution.leaderId.trim()
              : "",
          detail:
            typeof contribution?.detail === "string"
              ? contribution.detail.trim()
              : "",
        }))
        .filter(
          (contribution: PlannerContribution) =>
            contribution.leaderId || contribution.detail
        )
    : [];

  if (contributions.length) return contributions;

  const leaderId = typeof item?.leaderId === "string" ? item.leaderId.trim() : "";
  const detail = typeof item?.detail === "string" ? item.detail.trim() : "";
  return leaderId || detail ? [{ leaderId, detail }] : [];
};

const normalizeStoredItems = (value: unknown): PlannerItemPayload[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const contributions = normalizeContributions(item);
      const latest = contributions[contributions.length - 1];

      return {
        number: Number(item?.number),
        leaderId: latest?.leaderId || "",
        detail: latest?.detail || "",
        durationMinutes:
          Number.isFinite(Number(item?.durationMinutes)) &&
          Number(item?.durationMinutes) >= 0
            ? Math.round(Number(item.durationMinutes))
            : defaultDurations[Number(item?.number)] || 0,
        contributions,
      };
    })
    .filter((item) => Number.isFinite(item.number));
};

const mergePlannerItems = (
  existingValue: unknown,
  incomingItems: PlannerItemPayload[]
) => {
  const existingItems = new Map(
    normalizeStoredItems(existingValue).map((item) => [item.number, item])
  );

  return incomingItems.map((incoming) => {
    const existing = existingItems.get(incoming.number);
    const contributions = new Map(
      (existing?.contributions || []).map((contribution) => [
        contribution.leaderId || `legacy-${incoming.number}`,
        contribution,
      ])
    );

    for (const contribution of normalizeContributions(incoming)) {
      const contributionKey =
        contribution.leaderId || `anonymous-${incoming.number}`;
      const previous = contributions.get(contributionKey);
      contributions.set(contributionKey, {
        leaderId: contribution.leaderId || previous?.leaderId || "",
        detail: contribution.detail || previous?.detail || "",
      });
    }

    const mergedContributions = Array.from(contributions.values()).filter(
      (contribution) => contribution.leaderId || contribution.detail
    );
    const latest = mergedContributions[mergedContributions.length - 1];

    return {
      number: incoming.number,
      leaderId: latest?.leaderId || existing?.leaderId || "",
      detail: latest?.detail || existing?.detail || "",
      durationMinutes:
        Number.isFinite(incoming.durationMinutes) && incoming.durationMinutes >= 0
          ? incoming.durationMinutes
          : existing?.durationMinutes || defaultDurations[incoming.number] || 0,
      contributions: mergedContributions,
    };
  });
};

const parsePlannerPayload = (payload: unknown, role: "admin" | "teacher") => {
  const data = payload as {
    id?: unknown;
    group?: unknown;
    meetingDate?: unknown;
    selectedDate?: unknown;
    weekKey?: unknown;
    status?: unknown;
    items?: unknown;
  };

  const id = typeof data.id === "string" ? data.id.trim() : "";
  const requestedGroup = typeof data.group === "string" ? data.group.trim() : "";
  const group = requestedGroup || (role === "admin" ? "general" : "");
  const meetingDateValue =
    typeof data.meetingDate === "string" ? data.meetingDate.trim() : "";
  const selectedDateValue =
    typeof data.selectedDate === "string" ? data.selectedDate.trim() : "";
  const requestedWeekKey =
    typeof data.weekKey === "string" ? data.weekKey.trim() : "";
  const status = data.status === "published" ? "published" : "draft";

  const validGroup = group === "general" || plannerGroups.includes(group);
  if (!validGroup || (role === "teacher" && group === "general")) {
    throw new PlannerUserError("Selecciona un grupo valido.");
  }

  if (!selectedDateValue && !meetingDateValue && !requestedWeekKey) {
    throw new PlannerUserError("Selecciona la fecha de la semana.");
  }

  const week = getPlannerWeek(
    selectedDateValue || meetingDateValue || requestedWeekKey
  );
  if (!week) {
    throw new PlannerUserError("Selecciona una fecha valida.");
  }

  const meetingDate = dateKeyToUtcDate(week.weekStart, 12);
  const selectedDate = dateKeyToUtcDate(week.selectedDate, 12);
  const weekStart = dateKeyToUtcDate(week.weekStart, 12);
  const weekEnd = dateKeyToUtcDate(week.weekEnd, 12);

  if (!Array.isArray(data.items)) {
    throw new PlannerUserError("Completa la informacion del planificador.");
  }

  const itemNumbers =
    group === "general" ? generalPlannerItemNumbers : groupPlannerItemNumbers;

  const incomingItems = data.items instanceof Array ? data.items : [];
  const orderedItemNumbers = incomingItems
    .map((entry) => Number(entry?.number))
    .filter(
      (number, index, values) =>
        itemNumbers.includes(number) && values.indexOf(number) === index
    );
  const completeItemNumbers = [
    ...orderedItemNumbers,
    ...itemNumbers.filter((number) => !orderedItemNumbers.includes(number)),
  ];

  const items = completeItemNumbers.map((number) => {
    const item = data.items instanceof Array
      ? data.items.find((entry) => Number(entry?.number) === number)
      : null;

    return {
      number,
      leaderId: typeof item?.leaderId === "string" ? item.leaderId.trim() : "",
      detail: typeof item?.detail === "string" ? item.detail.trim() : "",
      durationMinutes:
        Number.isFinite(Number(item?.durationMinutes)) &&
        Number(item?.durationMinutes) >= 0
          ? Math.round(Number(item.durationMinutes))
          : defaultDurations[number] || 0,
    };
  });

  return {
    id,
    group,
    groupName: groupNames[group] || group,
    meetingDate,
    selectedDate,
    weekStart,
    weekEnd,
    weekKey: week.weekKey,
    year: week.year,
    status,
    items,
  };
};

const ensurePlannerManager = async () => {
  const currentUser = await getCurrentUser();

  if (currentUser?.role !== "teacher" && currentUser?.role !== "admin") {
    throw new PlannerUserError(
      "No tienes permiso para administrar planificadores."
    );
  }

  return {
    ...currentUser,
    role: currentUser.role as "admin" | "teacher",
  };
};

const getWeekWhere = (weekKey: string) => {
  const normalizedWeek = getPlannerWeek(weekKey);
  if (!normalizedWeek) return null;

  return {
    week: normalizedWeek,
    where: {
      OR: [
        { weekKey: normalizedWeek.weekKey },
        {
          weekKey: null,
          meetingDate: {
            gte: dateKeyToUtcDate(normalizedWeek.weekStart, 0),
            lt: dateKeyToUtcDate(
              addDaysToDateKey(normalizedWeek.weekStart, 7),
              0
            ),
          },
        },
      ],
    },
  };
};

const summarizePlanner = (planner: {
  group: string;
  status: string;
  items: unknown;
  updatedAt: Date;
}) => {
  const items = normalizeStoredItems(planner.items);
  const leaders = new Set(
    items
      .flatMap((item) => item.contributions || [])
      .map((contribution) => contribution.leaderId)
      .filter(Boolean)
  );

  return {
    group: planner.group,
    activities: items.length,
    durationMinutes: items.reduce(
      (total, item) => total + item.durationMinutes,
      0
    ),
    leadersAssigned: leaders.size,
    pendingActivities: items.filter(
      (item) =>
        !(item.contributions || []).some(
          (contribution) => contribution.leaderId && contribution.detail
        )
    ).length,
    status: planner.status === "published" ? "published" : "draft",
    updatedAt: planner.updatedAt,
  };
};

export const GET = async (req: Request) => {
  try {
    await ensurePlannerManager();

    const url = new URL(req.url);
    const requestedWeek = url.searchParams.get("weekKey") || "";
    const requestedGroup = url.searchParams.get("group") || "";
    const weekFilter = requestedWeek ? getWeekWhere(requestedWeek) : null;

    if (requestedWeek && !weekFilter) {
      return NextResponse.json(
        { message: "Selecciona una semana valida." },
        { status: 400 }
      );
    }

    const planners = await prisma.meetingPlanner.findMany({
      where: {
        ...(weekFilter?.where || {}),
        ...(requestedGroup &&
        (requestedGroup === "general" || plannerGroups.includes(requestedGroup))
          ? { group: requestedGroup }
          : {}),
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });
    const latestByGroup = new Map<
      string,
      (typeof planners)[number]
    >();

    planners.forEach((planner) => {
      if (!latestByGroup.has(planner.group)) {
        latestByGroup.set(planner.group, planner);
      }
    });

    return NextResponse.json({
      weekKey: weekFilter?.week.weekKey || null,
      planners,
      summary: Array.from(latestByGroup.values()).map(summarizePlanner),
    });
  } catch {
    return NextResponse.json(
      { message: "No se pudieron cargar los planificadores." },
      { status: 500 }
    );
  }
};

export const POST = async (req: Request) => {
  try {
    const currentUser = await ensurePlannerManager();
    const payload = parsePlannerPayload(await req.json(), currentUser.role);

    const canonicalPlanner = await prisma.meetingPlanner.findUnique({
      where: {
        group_meetingDate: {
          group: payload.group,
          meetingDate: payload.meetingDate,
        },
      },
    });
    const weekFilter = getWeekWhere(payload.weekKey)!;
    const existingPlanner =
      canonicalPlanner ||
      (await prisma.meetingPlanner.findFirst({
        where: {
          group: payload.group,
          ...weekFilter.where,
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      }));

    if (existingPlanner) {
      const planner = await prisma.meetingPlanner.update({
        where: { id: existingPlanner.id },
        data: {
          groupName: payload.groupName,
          meetingDate: payload.meetingDate,
          selectedDate: payload.selectedDate,
          weekStart: payload.weekStart,
          weekEnd: payload.weekEnd,
          weekKey: payload.weekKey,
          year: payload.year,
          status: payload.status,
          items: mergePlannerItems(existingPlanner.items, payload.items),
        },
      });

      revalidatePath("/planificador");
      return NextResponse.json(planner);
    }

    const planner = await prisma.meetingPlanner.create({
      data: {
        group: payload.group,
        groupName: payload.groupName,
        meetingDate: payload.meetingDate,
        selectedDate: payload.selectedDate,
        weekStart: payload.weekStart,
        weekEnd: payload.weekEnd,
        weekKey: payload.weekKey,
        year: payload.year,
        status: payload.status,
        items: payload.items,
        createdById: currentUser.id,
        createdByName: currentUser.name || currentUser.email || "Lider",
      },
    });

    revalidatePath("/planificador");

    return NextResponse.json(planner, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message: getPlannerErrorMessage(
          error,
          "No se pudo guardar el planificador."
        ),
      },
      { status: 400 }
    );
  }
};

export const PATCH = async (req: Request) => {
  try {
    const currentUser = await ensurePlannerManager();
    const payload = parsePlannerPayload(await req.json(), currentUser.role);

    if (!payload.id) {
      throw new PlannerUserError("No se encontro el planificador.");
    }

    const existingPlanner = await prisma.meetingPlanner.findUnique({
      where: { id: payload.id },
      select: {
        createdById: true,
        group: true,
        items: true,
        meetingDate: true,
      },
    });

    const canEdit =
      existingPlanner &&
      existingPlanner.group === payload.group &&
      (currentUser.role === "admin"
        ? existingPlanner.group === "general" ||
          plannerGroups.includes(existingPlanner.group)
        : plannerGroups.includes(existingPlanner.group));

    if (!canEdit) {
      return NextResponse.json(
        { message: "No puedes editar este planificador." },
        { status: 403 }
      );
    }

    const weekFilter = getWeekWhere(payload.weekKey)!;
    const plannerForWeek = await prisma.meetingPlanner.findFirst({
      where: {
        id: { not: payload.id },
        group: payload.group,
        ...weekFilter.where,
      },
      select: { id: true },
    });

    if (plannerForWeek) {
      return NextResponse.json(
        {
          message:
            "Ya existe un planificador de este grupo para la semana seleccionada.",
        },
        { status: 409 }
      );
    }

    const planner = await prisma.meetingPlanner.update({
      where: { id: payload.id },
      data: {
        group: payload.group,
        groupName: payload.groupName,
        meetingDate: payload.meetingDate,
        selectedDate: payload.selectedDate,
        weekStart: payload.weekStart,
        weekEnd: payload.weekEnd,
        weekKey: payload.weekKey,
        year: payload.year,
        status: payload.status,
        items: mergePlannerItems(existingPlanner.items, payload.items),
      },
    });

    revalidatePath("/planificador");

    return NextResponse.json(planner);
  } catch (error) {
    return NextResponse.json(
      {
        message: getPlannerErrorMessage(
          error,
          "No se pudo actualizar el planificador."
        ),
      },
      { status: 400 }
    );
  }
};

export const DELETE = async (req: Request) => {
  try {
    const currentUser = await ensurePlannerManager();
    const { id } = (await req.json()) as { id?: string };

    if (!id) {
      throw new PlannerUserError("No se encontro el planificador.");
    }

    const existingPlanner = await prisma.meetingPlanner.findUnique({
      where: { id },
      select: { createdById: true, group: true },
    });

    const canDelete =
      existingPlanner &&
      (currentUser.role === "admin"
        ? existingPlanner.group === "general" ||
          plannerGroups.includes(existingPlanner.group)
        : plannerGroups.includes(existingPlanner.group));

    if (!canDelete) {
      return NextResponse.json(
        { message: "No puedes eliminar este planificador." },
        { status: 403 }
      );
    }

    await prisma.meetingPlanner.delete({ where: { id } });
    revalidatePath("/planificador");

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        message: getPlannerErrorMessage(
          error,
          "No se pudo eliminar el planificador."
        ),
      },
      { status: 400 }
    );
  }
};
