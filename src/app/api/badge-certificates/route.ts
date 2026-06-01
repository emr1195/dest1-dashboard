import { getCurrentUser } from "@/lib/auth";
import { getBadgeCatalog, getStudentGroupName } from "@/lib/badgeCatalog";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

type CertificateStatus = "pending" | "approved" | "rejected";

type BadgeRecord = {
  userId: string;
  userType: "student" | "teacher";
  badgeId: string;
  certificatePath: string;
  certificateName?: string;
  createdAt: string;
  status?: CertificateStatus;
  reviewedAt?: string;
  reviewedBy?: string;
};

const dataDir = path.join(process.cwd(), "data");
const dataPath = path.join(dataDir, "badge-certificates.json");

const readRecords = async (): Promise<BadgeRecord[]> => {
  try {
    return JSON.parse(await readFile(dataPath, "utf8")) as BadgeRecord[];
  } catch {
    return [];
  }
};

const writeRecords = async (records: BadgeRecord[]) => {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataPath, JSON.stringify(records, null, 2));
};

const removeCertificateFile = async (certificatePath?: string) => {
  if (!certificatePath?.startsWith("/uploads/certificates/")) return;

  const filePath = path.join(process.cwd(), "public", certificatePath);

  try {
    await unlink(filePath);
  } catch {
    // El registro debe poder eliminarse aunque el archivo fisico ya no exista.
  }
};

const recordStatus = (record: BadgeRecord): CertificateStatus =>
  record.status || "approved";

const allowedBadges = async (userId: string, userType: "student" | "teacher") => {
  if (userType === "teacher") return getBadgeCatalog("teacher");

  const student = await prisma.muchacho.findUnique({
    where: { id: userId },
    select: { birthday: true },
  });

  if (!student) return [];

  return getBadgeCatalog("student", getStudentGroupName(student.birthday));
};

export const GET = async (req: Request) => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");
  const records = await readRecords();

  if (scope === "review") {
    if (currentUser.role !== "admin") {
      return NextResponse.json({ message: "No autorizado." }, { status: 403 });
    }

    const reviewRecords = await Promise.all(
      records
        .filter((record) => recordStatus(record) === "pending")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(async (record) => {
          const catalog = await allowedBadges(record.userId, record.userType);
          const badge = catalog.find((item) => item.id === record.badgeId);

          return {
            ...record,
            status: recordStatus(record),
            badge,
          };
        })
    );

    return NextResponse.json({ records: reviewRecords });
  }

  const userId = searchParams.get("userId");
  const userType = searchParams.get("userType");

  if (!userId || (userType !== "student" && userType !== "teacher")) {
    return NextResponse.json({ message: "Datos invalidos." }, { status: 400 });
  }

  const userRecords = records.filter(
    (record) => record.userId === userId && record.userType === userType
  );
  const completedBadges = userRecords
    .filter((record) => recordStatus(record) === "approved")
    .map((record) => record.badgeId);
  const statuses = Object.fromEntries(
    userRecords.map((record) => [record.badgeId, recordStatus(record)])
  );

  return NextResponse.json({ completedBadges, statuses });
};

export const POST = async (req: Request) => {
  const currentUser = await getCurrentUser();

  if (!currentUser?.id || (currentUser.role !== "student" && currentUser.role !== "teacher")) {
    return NextResponse.json({ message: "Solo lideres y muchachos pueden enviar certificados." }, { status: 403 });
  }

  const formData = await req.formData();
  const badgeId = formData.get("badgeId");
  const file = formData.get("file");
  const userType = currentUser.role;

  if (typeof badgeId !== "string" || !(file instanceof File)) {
    return NextResponse.json({ message: "Datos invalidos." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ message: "El certificado debe ser una imagen." }, { status: 400 });
  }

  const catalog = await allowedBadges(currentUser.id, userType);
  const badge = catalog.find((item) => item.id === badgeId);

  if (!badge) {
    return NextResponse.json({ message: "Curso no disponible para este perfil." }, { status: 400 });
  }

  const extension = path.extname(file.name) || ".jpg";
  const fileName = `${userType}-${currentUser.id}-${badgeId}-${randomUUID()}${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "certificates");
  const certificatePath = `/uploads/certificates/${fileName}`;

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()));

  const records = await readRecords();
  const nextRecords = records.filter(
    (record) =>
      !(record.userId === currentUser.id && record.userType === userType && record.badgeId === badgeId)
  );

  nextRecords.push({
    userId: currentUser.id,
    userType,
    badgeId,
    certificatePath,
    certificateName: file.name,
    createdAt: new Date().toISOString(),
    status: "pending",
  });

  await writeRecords(nextRecords);

  return NextResponse.json({ badgeId, status: "pending" });
};

export const PATCH = async (req: Request) => {
  const currentUser = await getCurrentUser();

  if (currentUser?.role !== "admin") {
    return NextResponse.json({ message: "Solo el admin puede validar certificados." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const status = body?.status;

  if (
    typeof body?.userId !== "string" ||
    (body?.userType !== "student" && body?.userType !== "teacher") ||
    typeof body?.badgeId !== "string" ||
    (status !== "approved" && status !== "rejected")
  ) {
    return NextResponse.json({ message: "Datos invalidos." }, { status: 400 });
  }

  const records = await readRecords();
  let found = false;
  const nextRecords = records.map((record) => {
    if (
      record.userId === body.userId &&
      record.userType === body.userType &&
      record.badgeId === body.badgeId
    ) {
      found = true;
      return {
        ...record,
        status,
        reviewedAt: new Date().toISOString(),
        reviewedBy: currentUser.id,
      };
    }

    return record;
  });

  if (!found) {
    return NextResponse.json({ message: "Solicitud no encontrada." }, { status: 404 });
  }

  await writeRecords(nextRecords);

  return NextResponse.json({ status });
};

export const DELETE = async (req: Request) => {
  const currentUser = await getCurrentUser();

  if (!currentUser?.id || (currentUser.role !== "student" && currentUser.role !== "teacher")) {
    return NextResponse.json({ message: "Solo lideres y muchachos pueden eliminar sus certificados." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const badgeId = searchParams.get("badgeId");
  const userType = currentUser.role;

  if (!badgeId) {
    return NextResponse.json({ message: "Curso invalido." }, { status: 400 });
  }

  const catalog = await allowedBadges(currentUser.id, userType);
  const badge = catalog.find((item) => item.id === badgeId);

  if (!badge) {
    return NextResponse.json({ message: "Curso no disponible para este perfil." }, { status: 400 });
  }

  const records = await readRecords();
  const removedRecords = records.filter(
    (record) =>
      record.userId === currentUser.id &&
      record.userType === userType &&
      record.badgeId === badgeId
  );

  if (!removedRecords.length) {
    return NextResponse.json({ message: "Certificado no encontrado." }, { status: 404 });
  }

  const nextRecords = records.filter(
    (record) =>
      !(record.userId === currentUser.id && record.userType === userType && record.badgeId === badgeId)
  );

  await Promise.all(removedRecords.map((record) => removeCertificateFile(record.certificatePath)));
  await writeRecords(nextRecords);

  return NextResponse.json({ ok: true, badgeId });
};
