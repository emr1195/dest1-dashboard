import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

const plannerGroups = ["navegantes", "pioneros", "seguidores", "exploradores"];
const plannerItemNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const parsePlannerPayload = (payload: unknown) => {
  const data = payload as {
    id?: unknown;
    group?: unknown;
    meetingDate?: unknown;
    items?: unknown;
  };

  const id = typeof data.id === "string" ? data.id.trim() : "";
  const group = typeof data.group === "string" ? data.group.trim() : "";
  const meetingDateValue =
    typeof data.meetingDate === "string" ? data.meetingDate.trim() : "";

  if (!plannerGroups.includes(group)) {
    throw new Error("Selecciona un grupo valido.");
  }

  if (!meetingDateValue) {
    throw new Error("Selecciona la fecha de la semana.");
  }

  const meetingDate = new Date(`${meetingDateValue}T12:00:00`);
  if (Number.isNaN(meetingDate.getTime())) {
    throw new Error("Selecciona una fecha valida.");
  }

  if (!Array.isArray(data.items)) {
    throw new Error("Completa la informacion del planificador.");
  }

  const items = plannerItemNumbers.map((number) => {
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

const ensureTeacher = async () => {
  const currentUser = await getCurrentUser();

  if (currentUser?.role !== "teacher") {
    throw new Error("Solo los lideres pueden guardar planificadores.");
  }

  return currentUser;
};

export const POST = async (req: Request) => {
  try {
    const currentUser = await ensureTeacher();
    const payload = parsePlannerPayload(await req.json());

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
    const currentUser = await ensureTeacher();
    const payload = parsePlannerPayload(await req.json());

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
    const currentUser = await ensureTeacher();
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
