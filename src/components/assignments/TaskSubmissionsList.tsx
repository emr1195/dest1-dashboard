"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type TaskSubmissionItem = {
  id: string; studentName: string; fileName: string; href: string; submittedAt: string;
  submittedLabel: string; timing: "on-time" | "late"; reviewed: boolean;
};

const fileLabel = (name: string) => {
  const ext = name.split(".").pop()?.toUpperCase() || "FILE";
  if (["DOC", "DOCX"].includes(ext)) return "DOC";
  if (["XLS", "XLSX", "CSV"].includes(ext)) return "XLS";
  if (["PPT", "PPTX"].includes(ext)) return "PPT";
  if (["JPG", "JPEG", "PNG", "WEBP"].includes(ext)) return "IMG";
  return ext.slice(0, 4);
};

const TaskSubmissionsList = ({ items }: { items: TaskSubmissionItem[] }) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [order, setOrder] = useState("recent");
  const visible = useMemo(() => items.filter((item) => {
    const matchesSearch = `${item.studentName} ${item.fileName}`.toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es"));
    const matchesStatus = !status || (status === "reviewed" ? item.reviewed : status === "pending" ? !item.reviewed : item.timing === status);
    return matchesSearch && matchesStatus;
  }).sort((a, b) => order === "name" ? a.studentName.localeCompare(b.studentName, "es") : order === "oldest" ? a.submittedAt.localeCompare(b.submittedAt) : b.submittedAt.localeCompare(a.submittedAt)), [items, order, search, status]);

  return (
    <section aria-labelledby="submissions-title">
      <div className="flex flex-col gap-3 border-b border-[var(--border-soft)] pb-4">
        <div className="flex items-center justify-between gap-3"><h3 id="submissions-title" className="text-lg font-extrabold text-[var(--text-primary)]">Respuestas de los muchachos</h3><span className="shrink-0 rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-bold text-[var(--primary)]">{items.length} {items.length === 1 ? "entrega" : "entregas"}</span></div>
        {items.length > 0 && <div className="grid gap-2 sm:grid-cols-3"><label className="sr-only" htmlFor="submission-search">Buscar estudiante</label><input id="submission-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar estudiante..." className="h-10 rounded-xl border border-[var(--border-default)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--focus-ring)]" /><select aria-label="Filtrar entregas" value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-xl border border-[var(--border-default)] px-3 text-sm outline-none"><option value="">Todos los estados</option><option value="on-time">A tiempo</option><option value="late">Atrasadas</option><option value="pending">Pendientes de revisión</option><option value="reviewed">Evaluadas</option></select><select aria-label="Ordenar entregas" value={order} onChange={(e) => setOrder(e.target.value)} className="h-10 rounded-xl border border-[var(--border-default)] px-3 text-sm outline-none"><option value="recent">Más recientes</option><option value="oldest">Más antiguas</option><option value="name">Nombre</option></select></div>}
      </div>
      {visible.length ? <div className="mt-3 space-y-2">{visible.map((item) => <article key={item.id} className="flex flex-col gap-3 rounded-xl border border-[var(--border-soft)] bg-white p-3 transition hover:border-[var(--border-default)] hover:bg-[var(--surface-secondary)] sm:flex-row sm:items-center">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--primary-soft)] text-sm font-extrabold text-[var(--primary)]">{item.studentName.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase()}</span>
        <div className="min-w-0 flex-1"><h4 className="truncate text-sm font-bold text-[var(--text-primary)]">{item.studentName}</h4><div className="mt-1 flex min-w-0 items-center gap-2"><span className="grid h-7 min-w-9 place-items-center rounded-md bg-slate-100 px-1 text-[9px] font-extrabold text-slate-700">{fileLabel(item.fileName)}</span><span title={item.fileName} className="truncate text-xs text-[var(--text-secondary)]">{item.fileName}</span></div><p className="mt-1 text-xs text-[var(--text-muted)]">Entregado el {item.submittedLabel}</p></div>
        <div className="flex flex-wrap items-center gap-2"><span className={`inline-flex min-h-7 items-center gap-1 rounded-full px-2.5 text-xs font-bold ${item.timing === "on-time" ? "bg-green-100 text-green-700" : "bg-red-50 text-red-700"}`}><span aria-hidden="true">{item.timing === "on-time" ? "✓" : "!"}</span>{item.timing === "on-time" ? "A tiempo" : "Atrasada"}</span><span className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-bold ${item.reviewed ? "bg-[var(--primary-soft)] text-[var(--primary)]" : "bg-amber-100 text-amber-800"}`}>{item.reviewed ? "Evaluada" : "Pendiente de revisión"}</span></div>
        <Link href={item.href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--primary)] px-3 text-sm font-bold text-[var(--primary)] hover:bg-[var(--primary-soft)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>Ver entrega</Link>
      </article>)}</div> : <div className="mt-4 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--surface-secondary)] p-6 text-center"><p className="font-bold text-[var(--text-primary)]">{items.length ? "No hay entregas con esos filtros." : "No hay respuestas todavía."}</p><p className="mt-1 text-sm text-[var(--text-secondary)]">{items.length ? "Prueba con otros criterios de búsqueda." : "Las entregas de los muchachos aparecerán aquí."}</p></div>}
    </section>
  );
};

export default TaskSubmissionsList;
