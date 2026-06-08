import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { fileToDataUrl } from "@/lib/uploadStorage";

const saveReceipt = async (file: File) => {
  if (!file.type.startsWith("image/")) {
    throw new Error("El comprobante debe ser una imagen.");
  }

  return fileToDataUrl(file, { allowedMimePrefixes: ["image/"] });
};

export const POST = async (req: Request) => {
  const currentUser = await getCurrentUser();

  if (currentUser?.role !== "admin") {
    return NextResponse.json(
      { message: "Solo el administrador puede registrar movimientos financieros." },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();
    const type = String(formData.get("type") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const amount = Number(formData.get("amount"));
    const dateValue = String(formData.get("date") || "").trim();
    const receipt = formData.get("receipt");

    if (!["INGRESO", "GASTO"].includes(type)) {
      throw new Error("Selecciona si el movimiento es un ingreso o un gasto.");
    }

    const validCategories =
      type === "INGRESO" ? ["Ofrendas", "Ventas", "Donaciones"] : ["Pago", "Reembolso", "Deuda"];

    if (!validCategories.includes(category)) {
      throw new Error("Selecciona una categoria valida para el movimiento.");
    }

    if (!title || !description || !dateValue || !Number.isFinite(amount) || amount <= 0) {
      throw new Error("Completa el nombre, descripcion, categoria, monto y fecha del movimiento.");
    }

    const date = new Date(`${dateValue}T12:00:00`);
    if (Number.isNaN(date.getTime())) {
      throw new Error("Selecciona una fecha valida.");
    }

    const receiptImage =
      receipt instanceof File && receipt.size > 0 ? await saveReceipt(receipt) : null;

    const transaction = await prisma.financeTransaction.create({
      data: {
        type,
        category,
        title,
        description,
        amount,
        date,
        receiptImage,
        createdById: currentUser.id,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/finances");

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo guardar el movimiento." },
      { status: 400 }
    );
  }
};
