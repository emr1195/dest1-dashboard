import { getCurrentUser } from "@/lib/auth";
import { getBadgeCatalog, getStudentGroupName } from "@/lib/badgeCatalog";
import prisma from "@/lib/prisma";
import { fileToDataUrl } from "@/lib/uploadStorage";
import { NextResponse } from "next/server";

type CertificateStatus = "pending" | "approved" | "rejected";

const recordStatus = (status?: string | null): CertificateStatus => {
  if (status === "pending" || status === "approved" || status === "rejected") {
    return status;
  }

  return "approved";
};

const toResponseRecord = (record: {
  userId: string;
  userType: string;
  badgeId: string;
  certificatePath: string;
  certificateName: string | null;
  status: string;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
}) => ({
  userId: record.userId,
  userType: record.userType,
  badgeId: record.badgeId,
  certificatePath: record.certificatePath,
  certificateName: record.certificateName || undefined,
  status: recordStatus(record.status),
  createdAt: record.createdAt.toISOString(),
  reviewedAt: record.reviewedAt?.toISOString(),
  reviewedBy: record.reviewedBy || undefined,
});

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

  if (scope === "review") {
    if (currentUser.role !== "admin") {
      return NextResponse.json({ message: "No autorizado." }, { status: 403 });
    }

    const records = await prisma.badgeCertificate.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
    });

    const reviewRecords = await Promise.all(
      records.map(async (record) => {
        const userType = record.userType === "teacher" ? "teacher" : "student";
        const catalog = await allowedBadges(record.userId, userType);
        const badge = catalog.find((item) => item.id === record.badgeId);

        return {
          ...toResponseRecord(record),
          userType,
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

  const userRecords = await prisma.badgeCertificate.findMany({
    where: { userId, userType },
  });
  const completedBadges = userRecords
    .filter((record) => recordStatus(record.status) === "approved")
    .map((record) => record.badgeId);
  const statuses = Object.fromEntries(
    userRecords.map((record) => [record.badgeId, recordStatus(record.status)])
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

  const certificatePath = await fileToDataUrl(file, {
    allowedMimePrefixes: ["image/"],
  });

  await prisma.badgeCertificate.upsert({
    where: {
      userId_userType_badgeId: {
        userId: currentUser.id,
        userType,
        badgeId,
      },
    },
    create: {
      userId: currentUser.id,
      userType,
      badgeId,
      certificatePath,
      certificateName: file.name,
      status: "pending",
    },
    update: {
      certificatePath,
      certificateName: file.name,
      status: "pending",
      reviewedAt: null,
      reviewedBy: null,
    },
  });

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

  const updated = await prisma.badgeCertificate.updateMany({
    where: {
      userId: body.userId,
      userType: body.userType,
      badgeId: body.badgeId,
    },
    data: {
      status,
      reviewedAt: new Date(),
      reviewedBy: currentUser.id,
    },
  });

  if (!updated.count) {
    return NextResponse.json({ message: "Solicitud no encontrada." }, { status: 404 });
  }

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

  const deleted = await prisma.badgeCertificate.deleteMany({
    where: {
      userId: currentUser.id,
      userType,
      badgeId,
    },
  });

  if (!deleted.count) {
    return NextResponse.json({ message: "Certificado no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, badgeId });
};
