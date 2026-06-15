import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { syncFirebaseAttendance } from "@/lib/firebaseAttendanceSync";

export const dynamic = "force-dynamic";

export const POST = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser || !["admin", "teacher"].includes(currentUser.role)) {
    return NextResponse.json(
      { message: "No tienes permiso para sincronizar asistencias." },
      { status: 403 }
    );
  }

  try {
    const result = await syncFirebaseAttendance();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Firebase attendance sync failed", error);
    return NextResponse.json(
      { message: "No se pudo sincronizar la asistencia desde Firebase." },
      { status: 502 }
    );
  }
};
