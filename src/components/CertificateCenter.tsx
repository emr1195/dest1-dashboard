"use client";

import { BadgeCourse } from "@/lib/badgeCatalog";
import Image from "next/image";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";

type CertificateStatus = "pending" | "approved" | "rejected";

type ReviewRecord = {
  userId: string;
  userType: "student" | "teacher";
  badgeId: string;
  certificatePath: string;
  certificateName?: string;
  status: CertificateStatus;
  createdAt: string;
  badge?: BadgeCourse;
};

const statusLabel: Record<CertificateStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

const statusClassName: Record<CertificateStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const CertificateCenter = ({
  role,
  userId,
  userType,
  badges = [],
  studentGroup,
}: {
  role: "admin" | "student" | "teacher";
  userId?: string;
  userType?: "student" | "teacher";
  badges?: BadgeCourse[];
  studentGroup?: string;
}) => {
  const [statuses, setStatuses] = useState<Record<string, CertificateStatus>>({});
  const [records, setRecords] = useState<ReviewRecord[]>([]);
  const [activeBadge, setActiveBadge] = useState<BadgeCourse | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    const url =
      role === "admin"
        ? "/api/badge-certificates?scope=review"
        : `/api/badge-certificates?userId=${encodeURIComponent(userId || "")}&userType=${encodeURIComponent(userType || "")}`;
    const response = await fetch(url);
    const data = await response.json().catch(() => null);

    if (!response.ok) return;

    if (role === "admin") {
      setRecords(Array.isArray(data?.records) ? data.records : []);
    } else {
      setStatuses(data?.statuses || {});
    }
  }, [role, userId, userType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const chooseCertificate = (badge: BadgeCourse) => {
    setActiveBadge(badge);
    fileInputRef.current?.click();
  };

  const submitCertificate = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !activeBadge) return;

    setSaving(true);
    setMessage("");
    const formData = new FormData();
    formData.append("badgeId", activeBadge.id);
    formData.append("file", file);

    const response = await fetch("/api/badge-certificates", {
      method: "POST",
      body: formData,
    });
    const data = await response.json().catch(() => null);

    setSaving(false);
    event.target.value = "";

    if (!response.ok) {
      setMessage(data?.message || "No se pudo enviar el certificado.");
      return;
    }

    setStatuses((current) => ({ ...current, [activeBadge.id]: "pending" }));
    setMessage("Certificado enviado para validacion.");
    setActiveBadge(null);
  };

  const reviewCertificate = async (record: ReviewRecord, status: "approved" | "rejected") => {
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/badge-certificates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: record.userId,
        userType: record.userType,
        badgeId: record.badgeId,
        status,
      }),
    });
    const data = await response.json().catch(() => null);

    setSaving(false);

    if (!response.ok) {
      setMessage(data?.message || "No se pudo validar el certificado.");
      return;
    }

    setRecords((current) =>
      current.filter(
        (item) =>
          !(
            item.userId === record.userId &&
            item.userType === record.userType &&
            item.badgeId === record.badgeId
          )
      )
    );
  };

  const deleteCertificate = async (badge: BadgeCourse) => {
    if (!window.confirm(`Seguro que quieres eliminar el certificado de ${badge.alt}?`)) return;

    setSaving(true);
    setMessage("");

    const response = await fetch(
      `/api/badge-certificates?badgeId=${encodeURIComponent(badge.id)}`,
      { method: "DELETE" }
    );
    const data = await response.json().catch(() => null);

    setSaving(false);

    if (!response.ok) {
      setMessage(data?.message || "No se pudo eliminar el certificado.");
      return;
    }

    setStatuses((current) => {
      const next = { ...current };
      delete next[badge.id];
      return next;
    });
    setMessage("Certificado eliminado.");
  };

  if (role === "admin") {
    return (
      <section className="rounded-md bg-white p-5">
        <h1 className="text-xl font-semibold">Validar certificados</h1>
        {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
        {!records.length ? (
          <p className="mt-6 rounded-md border border-dashed border-gray-200 p-5 text-sm text-gray-500">
            No hay certificados pendientes.
          </p>
        ) : (
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {records.map((record) => (
              <article
                key={`${record.userType}-${record.userId}-${record.badgeId}`}
                className="rounded-md border border-gray-200 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{record.userId}</p>
                    <p className="text-sm text-gray-500">
                      {record.userType === "student" ? "Muchacho" : "Lider"} - Curso {record.badge?.alt || record.badgeId}
                    </p>
                  </div>
                  {record.badge && (
                    <Image
                      src={record.badge.src}
                      alt={record.badge.alt}
                      width={58}
                      height={58}
                      className="h-14 w-14 object-contain"
                    />
                  )}
                </div>
                <div className="relative h-64 rounded-md bg-gray-50">
                  <Image
                    src={record.certificatePath}
                    alt={`Certificado de ${record.badge?.alt || record.badgeId}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1280px) 100vw, 50vw"
                  />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => reviewCertificate(record, "rejected")}
                    className="rounded-md border border-red-200 px-4 py-2 text-sm text-red-700 disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => reviewCertificate(record, "approved")}
                    className="rounded-md bg-lamaSky px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Aprobar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-md bg-white p-5">
      <h1 className="text-xl font-semibold">Certificados de cursos</h1>
      {studentGroup && <p className="mt-1 text-sm text-gray-500">{studentGroup}</p>}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={submitCertificate}
        className="hidden"
      />
      {message && <p className="mt-4 text-sm text-lamaSky">{message}</p>}
      {!badges.length ? (
        <p className="mt-6 rounded-md border border-dashed border-gray-200 p-5 text-sm text-gray-500">
          No hay cursos disponibles para este grupo.
        </p>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {badges.map((badge) => {
            const status = statuses[badge.id];

            return (
              <div key={badge.id} className="flex items-center gap-3 rounded-md border border-gray-200 p-3">
                <Image
                  src={badge.src}
                  alt={badge.alt}
                  width={58}
                  height={58}
                  className="h-14 w-14 shrink-0 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{badge.alt}</p>
                  {status && (
                    <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs ${statusClassName[status]}`}>
                      {statusLabel[status]}
                    </span>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => chooseCertificate(badge)}
                      disabled={saving}
                      className="text-xs font-semibold text-lamaSky hover:underline disabled:opacity-50"
                    >
                      {status ? "Reemplazar imagen" : "Subir imagen"}
                    </button>
                    {status && (
                      <button
                        type="button"
                        onClick={() => deleteCertificate(badge)}
                        disabled={saving}
                        className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                      >
                        Eliminar imagen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default CertificateCenter;
