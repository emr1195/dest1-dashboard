"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

type Props = { id: number; title: string; studentName: string; score: number; maxScore?: number | null; compact?: boolean };

const ResultScoreEditor = ({ id, title, studentName, score: initialScore, maxScore, compact }: Props) => {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(String(initialScore));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const numericScore = Number(score);
  const invalid = score === "" || !Number.isInteger(numericScore) || numericScore < 0 || (typeof maxScore === "number" && numericScore > maxScore);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) setOpen(false);
      if (event.key !== "Tab" || !dialogRef.current) return;
      const controls = dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!controls.length) return;
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", keydown); trigger?.focus(); };
  }, [open, saving]);

  const submit = async () => {
    if (invalid || saving) return;
    setSaving(true); setError("");
    const response = await fetch(`/api/results/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ score: numericScore }) });
    const data = await response.json().catch(() => null);
    if (!response.ok) { setError(data?.message || "No fue posible actualizar el resultado."); setSaving(false); return; }
    toast.success("Resultado actualizado correctamente.");
    setSaving(false); setOpen(false); router.refresh();
  };

  return <><button ref={triggerRef} type="button" onClick={() => setOpen(true)} aria-label={`Editar resultado de ${studentName}`} title="Editar resultado" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-[#2563EB] transition hover:bg-[#EFF6FF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>{compact && <span>Editar</span>}</button>{open && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F172A]/60 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setOpen(false); }}><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={`edit-result-${id}`} tabIndex={-1} className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)] outline-none"><h2 id={`edit-result-${id}`} className="text-xl font-extrabold text-[#0F172A]">Editar evaluación</h2><p className="mt-2 text-sm text-[#64748B]">{studentName} · {title}</p><label className="mt-5 block text-sm font-bold text-[#334155]" htmlFor={`result-score-${id}`}>Puntaje</label><div className="mt-2 flex items-center gap-3"><input id={`result-score-${id}`} value={score} onChange={(event) => setScore(event.target.value)} type="number" min={0} max={maxScore ?? undefined} step={1} aria-invalid={invalid} className={`h-12 w-28 rounded-xl border px-3 text-center text-lg font-extrabold outline-none focus:ring-4 ${invalid ? "border-[#DC2626] focus:ring-red-100" : "border-[#CBD5E1] focus:border-[#2563EB] focus:ring-blue-100"}`} />{maxScore && <span className="font-extrabold text-[#64748B]">/ {maxScore}</span>}</div>{invalid && <p role="alert" className="mt-2 text-xs font-bold text-[#DC2626]">Ingresa un número entero entre 0 y {maxScore ?? "el puntaje permitido"}.</p>}{error && <p role="alert" className="mt-3 rounded-xl bg-[#FEF2F2] px-3 py-2 text-sm font-semibold text-[#DC2626]">{error}</p>}<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" disabled={saving} onClick={() => setOpen(false)} className="min-h-11 rounded-xl border border-[#CBD5E1] px-4 text-sm font-bold hover:bg-[#F1F5F9]">Cancelar</button><button type="button" disabled={saving || invalid} onClick={submit} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 text-sm font-bold text-white hover:bg-[#1D4ED8] disabled:opacity-55">{saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />} {saving ? "Guardando…" : "Guardar cambios"}</button></div></div></div>}</>;
};

export default ResultScoreEditor;
