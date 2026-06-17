import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { dateKeyToUtcDate } from "@/lib/timeZone";
import { fileToDataUrl } from "@/lib/uploadStorage";

const savePoster = async (file: File) => {
  if (!file.type.startsWith("image/")) {
    throw new Error("El afiche debe ser una imagen.");
  }

  return fileToDataUrl(file, { allowedMimePrefixes: ["image/"] });
};

const activityInput = async (formData: FormData, requireImage: boolean) => {
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const date = String(formData.get("date") || "").trim();
  const rawCost = String(formData.get("cost") || "").trim();
  const file = formData.get("poster");

  if (!title || !description || !date) {
    throw new Error("Nombre, descripcion y fecha son requeridos.");
  }

  const eventDate = dateKeyToUtcDate(date, 12);
  if (Number.isNaN(eventDate.getTime())) {
    throw new Error("Selecciona una fecha valida.");
  }

  const cost = rawCost ? Number(rawCost) : null;
  if (cost !== null && (!Number.isFinite(cost) || cost < 0)) {
    throw new Error("El costo debe ser un numero valido.");
  }

  if (requireImage && !(file instanceof File && file.size)) {
    throw new Error("Selecciona el afiche de la actividad.");
  }

  const image =
    file instanceof File && file.size > 0 ? await savePoster(file) : undefined;

  return { title, description, cost, image, startTime: eventDate, endTime: eventDate };
};

const requireAdmin = async () => {
  const currentUser = await getCurrentUser();
  return currentUser?.role === "admin";
};

export const POST = async (req: Request) => {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "Solo el admin puede crear actividades." }, { status: 403 });
  }

  try {
    const data = await activityInput(await req.formData(), true);
    const activity = await prisma.event.create({ data });
    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo guardar la actividad." },
      { status: 400 }
    );
  }
};

export const PATCH = async (req: Request) => {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "Solo el admin puede modificar actividades." }, { status: 403 });
  }

  const formData = await req.formData();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) {
    return NextResponse.json({ message: "Actividad invalida." }, { status: 400 });
  }

  try {
    const data = await activityInput(formData, false);
    const activity = await prisma.event.update({ where: { id }, data });
    return NextResponse.json(activity);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo actualizar la actividad." },
      { status: 400 }
    );
  }
};

export const DELETE = async (req: Request) => {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "Solo el admin puede eliminar actividades." }, { status: 403 });
  }

  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) {
    return NextResponse.json({ message: "Actividad invalida." }, { status: 400 });
  }

  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
};
