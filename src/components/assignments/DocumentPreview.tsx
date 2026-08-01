"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  fileName: string;
  fileUrl: string;
  previewSrc: string;
  previewable: boolean;
  imageFile: boolean;
};

const DocumentPreview = ({ fileName, fileUrl, previewSrc, previewable, imageFile }: Props) => {
  const [loading, setLoading] = useState(previewable);
  const [failed, setFailed] = useState(false);

  const unavailable = !previewable || failed;

  return (
    <div className="overflow-hidden rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC]">
      <div className="relative min-h-[420px] sm:min-h-[560px] lg:min-h-[650px]">
        {loading && !unavailable && (
          <div role="status" className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#F8FAFC] text-[#64748B]">
            <span className="h-9 w-9 animate-spin rounded-full border-4 border-[#BFDBFE] border-t-[#2563EB] motion-reduce:animate-none" aria-hidden="true" />
            <p className="mt-4 text-sm font-bold">Cargando documento…</p>
          </div>
        )}

        {unavailable ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center p-6 text-center sm:min-h-[560px]">
            <div className="relative h-28 w-24 rounded-lg border-2 border-[#CBD5E1] bg-white shadow-sm" aria-hidden="true">
              <span className="absolute right-0 top-0 h-7 w-7 rounded-bl-md border-b border-l border-[#CBD5E1] bg-[#EFF6FF]" />
              <span className="absolute left-4 top-11 h-2 w-14 rounded bg-[#CBD5E1]" />
              <span className="absolute left-4 top-16 h-2 w-12 rounded bg-[#E2E8F0]" />
              <span className="absolute left-4 top-[84px] h-2 w-9 rounded bg-[#E2E8F0]" />
            </div>
            <h3 className="mt-5 text-base font-extrabold text-[#0F172A]">No fue posible mostrar la vista previa</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#64748B]">Puedes descargar el archivo para revisarlo en una aplicación compatible.</p>
            <a href={fileUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 text-sm font-bold text-white transition hover:bg-[#1D4ED8] focus:outline-none focus:ring-4 focus:ring-[#2563EB]/20">
              <DownloadIcon /> Descargar archivo
            </a>
          </div>
        ) : imageFile ? (
          <Image src={previewSrc} alt={fileName} fill unoptimized sizes="(max-width: 1280px) 100vw, 70vw" onLoad={() => setLoading(false)} onError={() => { setLoading(false); setFailed(true); }} className="object-contain p-4" />
        ) : (
          <iframe src={previewSrc} title={`Vista previa de ${fileName}`} onLoad={() => setLoading(false)} className="h-[65vh] min-h-[560px] w-full bg-white lg:h-[72vh]" />
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-[#E2E8F0] bg-white p-3 sm:flex-row sm:justify-end">
        <a href={fileUrl} download className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#CBD5E1] px-4 text-sm font-bold text-[#334155] transition hover:bg-[#F1F5F9] focus:outline-none focus:ring-4 focus:ring-[#2563EB]/15" title="Descargar archivo"><DownloadIcon />Descargar archivo</a>
        <a href={fileUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#2563EB] px-4 text-sm font-bold text-[#2563EB] transition hover:bg-[#EFF6FF] focus:outline-none focus:ring-4 focus:ring-[#2563EB]/15" title="Abrir en una pestaña nueva"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M14 3h7v7M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /></svg>Abrir en nueva pestaña</a>
      </div>
    </div>
  );
};

const DownloadIcon = () => <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>;

export default DocumentPreview;
