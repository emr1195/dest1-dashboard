import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { dateKeyToUtcDate } from "@/lib/timeZone";

const plannerGroups = ["navegantes", "pioneros", "seguidores", "exploradores"];
// Los planificadores de grupo solo contienen los cuatro momentos especificos.
// Se conservan sus numeros historicos para que los planes guardados sigan siendo compatibles.
const groupPlannerItemNumbers = [4, 5, 6, 7];
const generalPlannerItemNumbers = [1, 2, 3, 8, 9, 10];

type PlannerItemPayload = {
  number: number;
  leaderId: string;
  detail: string;
};

const normalizeStoredItems = (value: unknown): PlannerItemPayload[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => ({
      number: Number(item?.number),
      leaderId: typeof item?.leaderId === "string" ? item.leaderId : "",
      detail: typeof item?.detail === "string" ? item.detail : "",
    }))
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
    return {
      number: incoming.number,
      leaderId: incoming.leaderId || existing?.leaderId || "",
      detail: incoming.detail || existing?.detail || "",
    };
  });
};

const parsePlannerPayload = (payload: unknown, role: "admin" | "teacher") => {
  const data = payload as {
    id?: unknown;
    group?: unknown;
    meetingDate?: unknown;
    items?: unknown;
  };

  const id = typeof data.id === "string" ? data.id.trim() : "";
  const requestedGroup = typeof data.group === "string" ? data.group.trim() : "";
  const group = role === "admin" ? "general" : requestedGroup;
  const meetingDateValue =
    typeof data.meetingDate === "string" ? data.meetingDate.trim() : "";

  if (role === "teacher" && !plannerGroups.includes(group)) {
    throw new Error("Selecciona un grupo valido.");
  }

  if (!meetingDateValue) {
    throw new Error("Selecciona la fecha de la semana.");
  }

  const meetingDate = dateKeyToUtcDate(meetingDateValue, 12);
  if (Number.isNaN(meetingDate.getTime())) {
    throw new Error("Selecciona una fecha valida.");
  }

  if (!Array.isArray(data.items)) {
    throw new Error("Completa la informacion del planificador.");
  }

  const itemNumbers =
    group === "general" ? generalPlannerItemNumbers : groupPlannerItemNumbers;

  const items = itemNumbers.map((number) => {
    const item = data.items instanceof Array
      ? data.items.find((entry) => Number(entry?.number) === number)
      : null;

    return {
      number,
      leaderId: typeof item?.leaderId === "string" ? item.leaderId.trim() : "",
      detail: typeof item?.detail === "string" ? item.detail.trim() : "",
    };
  });

  return { id, group, meetingDate, items };
};

const ensurePlannerManager = async () => {
  const currentUser = await getCurrentUser();

  if (currentUser?.role !== "teacher" && currentUser?.role !== "admin") {
    throw new Error("No tienes permiso para administrar planificadores.");
  }

  return {
    ...currentUser,
    role: currentUser.role as "admin" | "teacher",
  };
};

const getTeacherPlannerGroup = async (user: {
  id: string;
  email?: string | null;
}) => {
  const account = await prisma.authUser.findFirst({
    where: {
      role: "teacher",
      OR: [
        { id: user.id },
        ...(user.email ? [{ email: user.email.toLowerCase() }] : []),
      ],
    },
    select: { leaderGroup: true },
  });

  return account?.leaderGroup && plannerGroups.includes(account.leaderGroup)
    ? account.leaderGroup
    : null;
};

export const POST = async (req: Request) => {
  try {
    const currentUser = await ensurePlannerManager();
    const payload = parsePlannerPayload(await req.json(), currentUser.role);

    if (currentUser.role === "teacher") {
      const teacherGroup = await getTeacherPlannerGroup(currentUser);
      if (teacherGroup && payload.group !== teacherGroup) {
        return NextResponse.json(
          { message: "Solo puedes guardar el planificador de tu grupo." },
          { status: 403 }
        );
      }
    }

    const existingPlanner = await prisma.meetingPlanner.findFirst({
      where: {
        group: payload.group,
        meetingDate: payload.meetingDate,
      },
      orderBy: { createdAt: "asc" },
    });

    if (existingPlanner) {
      const planner = await prisma.meetingPlanner.update({
        where: { id: existingPlanner.id },
        data: {
          items: mergePlannerItems(existingPlanner.items, payload.items),
        },
      });

      revalidatePath("/planificador");
      return NextResponse.json(planner);
    }

    const planner = await prisma.meetingPlanner.create({
      data: {
        group: payload.group,
        meetingDate: payload.meetingDate,
        items: payload.items,
        createdById: currentUser.id,
        createdByName: currentUser.name || currentUser.email || "Lider",
      },
    });

    revalidatePath("/planificador");

    return NextResponse.json(planner, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo guardar el planificador." },
      { status: 400 }
    );
  }
};

export const PATCH = async (req: Request) => {
  try {
    const currentUser = await ensurePlannerManager();
    const payload = parsePlannerPayload(await req.json(), currentUser.role);

    if (!payload.id) {
      throw new Error("No se encontro el planificador.");
    }

    const existingPlanner = await prisma.meetingPlanner.findUnique({
      where: { id: payload.id },
      select: { createdById: true, group: true },
    });

    const teacherGroup =
      currentUser.role === "teacher"
        ? await getTeacherPlannerGroup(currentUser)
        : null;
    const canEdit =
      existingPlanner &&
      existingPlanner.group === payload.group &&
      (currentUser.role === "admin"
        ? existingPlanner.group === "general"
        : teacherGroup
          ? existingPlanner.group === teacherGroup
          : existingPlanner.createdById === currentUser.id);

    if (!canEdit) {
      return NextResponse.json(
        { message: "No puedes editar este planificador." },
        { status: 403 }
      );
    }

    const planner = await prisma.meetingPlanner.update({
      where: { id: payload.id },
      data: {
        group: payload.group,
        meetingDate: payload.meetingDate,
        items: payload.items,
      },
    });

    revalidatePath("/planificador");

    return NextResponse.json(planner);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo actualizar el planificador." },
      { status: 400 }
    );
  }
};

export const DELETE = async (req: Request) => {
  try {
    const currentUser = await ensurePlannerManager();
    const { id } = (await req.json()) as { id?: string };

    if (!id) {
      throw new Error("No se encontro el planificador.");
    }

    const existingPlanner = await prisma.meetingPlanner.findUnique({
      where: { id },
      select: { createdById: true, group: true },
    });

    const teacherGroup =
      currentUser.role === "teacher"
        ? await getTeacherPlannerGroup(currentUser)
        : null;
    const canDelete =
      existingPlanner &&
      (currentUser.role === "admin"
        ? existingPlanner.group === "general"
        : teacherGroup
          ? existingPlanner.group === teacherGroup
          : existingPlanner.createdById === currentUser.id);

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
      { message: error instanceof Error ? error.message : "No se pudo eliminar el planificador." },
      { status: 400 }
    );
  }
};
