"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

type Props = {
  submissionId: string;
  maxScore: number;
  defaultScore?: number;
  defaultReviewNote?: string | null;
  currentStatus?: string;
};

const SubmissionReviewForm = ({ submissionId, maxScore, defaultScore, defaultReviewNote, currentStatus = "submitted" }: Props) => {
  const [score, setScore] = useState(String(defaultScore ?? maxScore));
  const [reviewNote, setReviewNote] = useState(defaultReviewNote || "");
  const [saving, setSaving] = useState(false);
  const [returning, setReturning] = useState(false);
  const [returnDialog, setReturnDialog] = useState(false);
  const [message, setMessage] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnTriggerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const numericScore = Number(score);
  const scoreInvalid = score === "" || !Number.isInteger(numericScore) || numericScore < 0 || numericScore > maxScore;

  useEffect(() => {
    if (!returnDialog) return;
    const previousOverflow = document.body.style.overflow;
    const returnTrigger = returnTriggerRef.current;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !returning) setReturnDialog(false);
      if (event.key !== "Tab" || !dialogRef.current) return;
      const controls = dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", keydown); returnTrigger?.focus(); };
  }, [returnDialog, returning]);

  const sendReview = async (action: "review" | "return") => {
    const response = await fetch("/api/assignment-submissions/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, score: numericScore, reviewNote, action }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || "No fue posible guardar la revisión. Intenta nuevamente.");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (scoreInvalid || saving || returning) return;
    setSaving(true);
    setMessage("");
    try {
      await sendReview("review");
      setMessage("La revisión fue guardada correctamente.");
      toast.success("La revisión fue guardada correctamente.");
      router.refresh();
    } catch (error) {
      const text = error instanceof Error ? error.message : "No fue posible guardar la revisión. Intenta nuevamente.";
      setMessage(text);
      toast.error(text);
    } finally {
      setSaving(false);
    }
  };

  const returnTask = async () => {
    if (!reviewNote.trim()) { setMessage("Escribe una observación antes de devolver la tarea."); setReturnDialog(false); return; }
    setReturning(true);
    setMessage("");
    try {
      await sendReview("return");
      setReturnDialog(false);
      setMessage("La tarea fue devuelta para corrección.");
      toast.success("La tarea fue devuelta para corrección.");
      router.refresh();
    } catch (error) {
      const text = error instanceof Error ? error.message : "No fue posible devolver la tarea. Intenta nuevamente.";
      setMessage(text);
      toast.error(text);
    } finally {
      setReturning(false);
    }
  };

  return (
    <>
      <form onSubmit={submit} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_6px_20px_rgba(15,23,42,0.05)] sm:p-6">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#EFF6FF] text-[#2563EB]"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M4 4h16v16H4zM8 9h8M8 13h5" /></svg></span><div><h2 className="text-lg font-extrabold text-[#0F172A]">Revisión de la tarea</h2><p className="text-xs text-[#64748B]">Califica la entrega y deja indicaciones claras.</p></div></div>

        <div className="mt-6">
          <label htmlFor="review-score" className="text-sm font-bold text-[#334155]">Puntuación</label>
          <div className="mt-2 flex items-center gap-3"><input id="review-score" value={score} onChange={(event) => setScore(event.target.value)} type="number" inputMode="numeric" min={0} max={maxScore} step={1} required aria-invalid={scoreInvalid} aria-describedby="score-help score-error" className={`h-12 w-24 rounded-[10px] border px-3 text-center text-lg font-extrabold text-[#0F172A] outline-none transition focus:ring-4 ${scoreInvalid ? "border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/10" : "border-[#CBD5E1] focus:border-[#2563EB] focus:ring-[#2563EB]/10"}`} /><span className="text-xl font-extrabold text-[#64748B]">/ {maxScore}</span></div>
          <p id="score-help" className="mt-2 text-xs text-[#64748B]">Máximo: {maxScore} puntos</p>
          {scoreInvalid && <p id="score-error" role="alert" className="mt-1 text-xs font-bold text-[#DC2626]">La puntuación debe ser un número entero entre 0 y {maxScore}.</p>}
        </div>

        <div className="mt-5">
          <div className="flex items-end justify-between gap-3"><label htmlFor="review-note" className="text-sm font-bold text-[#334155]">Observaciones y correcciones</label><span className="text-xs text-[#94A3B8]">{reviewNote.length}/3000</span></div>
          <textarea id="review-note" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} rows={7} maxLength={3000} placeholder="Escribe comentarios, correcciones o recomendaciones para el muchacho" aria-describedby="review-note-help" className="mt-2 min-h-40 w-full resize-y rounded-[10px] border border-[#CBD5E1] p-3 text-sm leading-6 text-[#334155] outline-none transition placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10" />
          <p id="review-note-help" className="mt-2 flex gap-2 text-xs leading-5 text-[#64748B]"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 h-4 w-4 shrink-0"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>Estas observaciones serán visibles para el muchacho y su acudiente.</p>
        </div>

        <div aria-live="polite" className="min-h-6">{message && <p className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${message.includes("correctamente") || message.includes("devuelta") ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEF2F2] text-[#DC2626]"}`}>{message}</p>}</div>
        <div className="mt-4 grid gap-3">
          <button type="submit" disabled={saving || returning || scoreInvalid} className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 text-sm font-bold text-white transition hover:bg-[#1D4ED8] focus:outline-none focus:ring-4 focus:ring-[#2563EB]/20 disabled:cursor-not-allowed disabled:opacity-55">{saving ? <><Spinner />Guardando…</> : <><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M5 3h12l2 2v16H5zM8 3v6h8V3M8 17h8" /></svg>Guardar revisión</>}</button>
          {currentStatus !== "returned" && <button ref={returnTriggerRef} type="button" onClick={() => { if (!reviewNote.trim()) { setMessage("Escribe una observación antes de devolver la tarea."); return; } setReturnDialog(true); }} disabled={saving || returning} className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-[#2563EB] bg-white px-4 text-sm font-bold text-[#2563EB] transition hover:bg-[#EFF6FF] focus:outline-none focus:ring-4 focus:ring-[#2563EB]/15 disabled:opacity-55"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="m9 14-4-4 4-4M5 10h9a5 5 0 0 1 5 5v3" /></svg>Devolver tarea</button>}
        </div>
      </form>

      {returnDialog && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F172A]/60 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !returning) setReturnDialog(false); }}><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="return-dialog-title" tabIndex={-1} className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)] outline-none"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#EFF6FF] text-[#2563EB]"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="m9 14-4-4 4-4M5 10h9a5 5 0 0 1 5 5v3" /></svg></span><h2 id="return-dialog-title" className="mt-4 text-xl font-extrabold text-[#0F172A]">¿Deseas devolver esta tarea?</h2><p className="mt-2 text-sm leading-6 text-[#64748B]">El muchacho podrá corregirla y enviarla nuevamente. La observación escrita quedará visible como guía.</p><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" disabled={returning} onClick={() => setReturnDialog(false)} className="min-h-11 rounded-xl border border-[#CBD5E1] px-4 text-sm font-bold text-[#334155] hover:bg-[#F1F5F9] focus:outline-none focus:ring-4 focus:ring-[#2563EB]/15">Cancelar</button><button type="button" disabled={returning} onClick={returnTask} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 text-sm font-bold text-white hover:bg-[#1D4ED8] focus:outline-none focus:ring-4 focus:ring-[#2563EB]/20 disabled:opacity-60">{returning ? <><Spinner />Devolviendo…</> : "Devolver tarea"}</button></div></div></div>}
    </>
  );
};

const Spinner = () => <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" aria-hidden="true" />;

export default SubmissionReviewForm;
