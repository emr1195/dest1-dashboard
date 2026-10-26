"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type OdtBlock =
  | { type: "heading"; text: string; level: number }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; rows: string[][] }
  | { type: "image"; src: string; alt: string };

type Props = {
  fileName: string;
  fileUrl: string;
};

const textFromNode = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || "";
  if (!(node instanceof Element)) return "";

  if (node.localName === "s") {
    const count = Number(node.getAttribute("text:c") || node.getAttribute("c") || 1);
    return " ".repeat(Number.isFinite(count) ? Math.min(count, 50) : 1);
  }
  if (node.localName === "tab") return "\t";
  if (node.localName === "line-break") return "\n";

  return Array.from(node.childNodes).map(textFromNode).join("");
};

const cleanText = (value: string) =>
  value
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();

const childElements = (element: Element) =>
  Array.from(element.children) as Element[];

const imageHref = (element: Element) =>
  element.getAttribute("xlink:href") ||
  element.getAttributeNS("http://www.w3.org/1999/xlink", "href") ||
  element.getAttribute("href") ||
  "";

const imageElements = (element: Element) =>
  Array.from(element.getElementsByTagNameNS("*", "image"));

const buildBlocks = (root: Element, imageUrls: Map<string, string>) => {
  const blocks: OdtBlock[] = [];

  const appendImages = (element: Element) => {
    imageElements(element).forEach((image, index) => {
      const href = imageHref(image);
      const src = imageUrls.get(href);
      if (!src) return;
      blocks.push({
        type: "image",
        src,
        alt: image.getAttribute("draw:name") || `Imagen ${index + 1}`,
      });
    });
  };

  const visit = (container: Element) => {
    childElements(container).forEach((element) => {
      if (element.localName === "h") {
        const text = cleanText(textFromNode(element));
        const level = Number(
          element.getAttribute("text:outline-level") ||
            element.getAttribute("outline-level") ||
            2
        );
        if (text) blocks.push({ type: "heading", text, level });
        appendImages(element);
        return;
      }

      if (element.localName === "p") {
        const text = cleanText(textFromNode(element));
        if (text) blocks.push({ type: "paragraph", text });
        appendImages(element);
        return;
      }

      if (element.localName === "list") {
        const items = childElements(element)
          .filter((item) => item.localName === "list-item")
          .map((item) => cleanText(textFromNode(item)))
          .filter(Boolean);
        if (items.length) blocks.push({ type: "list", items });
        appendImages(element);
        return;
      }

      if (element.localName === "table") {
        const rows = Array.from(element.getElementsByTagNameNS("*", "table-row"))
          .map((row) =>
            childElements(row)
              .filter(
                (cell) =>
                  cell.localName === "table-cell" ||
                  cell.localName === "covered-table-cell"
              )
              .map((cell) => cleanText(textFromNode(cell)))
          )
          .filter((row) => row.length);
        if (rows.length) blocks.push({ type: "table", rows });
        appendImages(element);
        return;
      }

      if (element.localName === "image") {
        appendImages(element.parentElement || element);
        return;
      }

      visit(element);
    });
  };

  visit(root);
  return blocks;
};

const mimeFromPath = (path: string) => {
  const extension = path.split(".").pop()?.toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "gif") return "image/gif";
  if (extension === "webp") return "image/webp";
  if (extension === "svg") return "image/svg+xml";
  return "image/jpeg";
};

const OdtPreview = ({ fileName, fileUrl }: Props) => {
  const [blocks, setBlocks] = useState<OdtBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];

    const loadDocument = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error("No se pudo descargar el documento.");

        const { default: JSZip } = await import("jszip");
        const archive = await JSZip.loadAsync(await response.arrayBuffer());
        const contentEntry = archive.file("content.xml");
        if (!contentEntry) throw new Error("El archivo ODT no contiene content.xml.");

        const xml = await contentEntry.async("string");
        const document = new DOMParser().parseFromString(xml, "application/xml");
        if (document.querySelector("parsererror")) {
          throw new Error("El contenido del documento no es valido.");
        }

        const textRoot = document.getElementsByTagNameNS("*", "text")[0];
        if (!textRoot) throw new Error("No se encontro el contenido del documento.");

        const imageUrls = new Map<string, string>();
        const references = Array.from(
          new Set(imageElements(textRoot).map(imageHref).filter(Boolean))
        );

        await Promise.all(
          references.map(async (href) => {
            if (/^(?:https?:|data:|javascript:)/i.test(href)) return;
            const normalizedPath = href.replace(/^\.\//, "");
            const entry = archive.file(normalizedPath);
            if (!entry) return;
            const blob = await entry.async("blob");
            const url = URL.createObjectURL(
              new Blob([blob], { type: mimeFromPath(normalizedPath) })
            );
            objectUrls.push(url);
            imageUrls.set(href, url);
          })
        );

        const parsedBlocks = buildBlocks(textRoot, imageUrls);
        if (!cancelled) setBlocks(parsedBlocks);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No fue posible mostrar el documento ODT."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDocument();

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [fileUrl]);

  if (loading) {
    return (
      <div role="status" className="flex min-h-[560px] flex-col items-center justify-center bg-slate-50 text-slate-500">
        <span className="h-9 w-9 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-600 motion-reduce:animate-none" aria-hidden="true" />
        <p className="mt-4 text-sm font-bold">Abriendo documento ODT...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[560px] flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-xl bg-cyan-50 text-sm font-black text-cyan-700">ODT</span>
        <h3 className="mt-4 text-base font-extrabold text-slate-900">No fue posible mostrar el documento</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{error}</p>
        <a href={fileUrl} download={fileName} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">Descargar archivo</a>
      </div>
    );
  }

  return (
    <div className="max-h-[75vh] min-h-[560px] overflow-auto bg-slate-100 p-3 sm:p-6">
      <article className="mx-auto min-h-[720px] max-w-[850px] bg-white px-5 py-8 text-slate-800 shadow-sm sm:px-12 sm:py-12">
        {blocks.length ? blocks.map((block, index) => {
          if (block.type === "heading") {
            const headingClass = block.level <= 1 ? "text-2xl" : block.level === 2 ? "text-xl" : "text-lg";
            return <h3 key={index} className={`mb-3 mt-6 font-extrabold leading-tight first:mt-0 ${headingClass}`}>{block.text}</h3>;
          }
          if (block.type === "paragraph") {
            return <p key={index} className="mb-4 whitespace-pre-wrap text-sm leading-7 sm:text-base">{block.text}</p>;
          }
          if (block.type === "list") {
            return <ul key={index} className="mb-4 list-disc space-y-2 pl-6 text-sm leading-7 sm:text-base">{block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ul>;
          }
          if (block.type === "table") {
            return <div key={index} className="mb-5 overflow-x-auto"><table className="w-full border-collapse text-left text-sm"><tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border border-slate-300 p-2 align-top whitespace-pre-wrap">{cell}</td>)}</tr>)}</tbody></table></div>;
          }
          return <Image key={index} src={block.src} alt={block.alt} width={1200} height={800} unoptimized className="mx-auto mb-5 h-auto max-h-[520px] max-w-full object-contain" />;
        }) : <p className="text-center text-sm text-slate-500">El documento no contiene texto visible.</p>}
      </article>
    </div>
  );
};

export default OdtPreview;
