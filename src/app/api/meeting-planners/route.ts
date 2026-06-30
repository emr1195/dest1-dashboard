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

export const POST = async (req: Request) => {
  try {
    const currentUser = await ensurePlannerManager();
    const payload = parsePlannerPayload(await req.json(), currentUser.role);

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
      select: { createdById: true },
    });

    if (!existingPlanner || existingPlanner.createdById !== currentUser.id) {
      return NextResponse.json(
        { message: "Solo puedes editar tus propios planificadores." },
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
      select: { createdById: true },
    });

    if (!existingPlanner || existingPlanner.createdById !== currentUser.id) {
      return NextResponse.json(
        { message: "Solo puedes eliminar tus propios planificadores." },
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
