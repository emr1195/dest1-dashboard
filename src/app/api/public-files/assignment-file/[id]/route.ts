import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const dataUrlToFile = (dataUrl: string) => {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;

  return {
    contentType: match[1],
    bytes: Buffer.from(match[2], "base64"),
  };
};

export const GET = async (
  _request: Request,
  { params }: { params: { id: string } }
) => {
  const assignmentFile = await prisma.assignmentFile.findUnique({
    where: { id: params.id },
    select: { fileName: true, filePath: true, fileType: true },
  });

  if (!assignmentFile) {
    return NextResponse.json({ message: "Archivo no encontrado." }, { status: 404 });
  }

  if (/^https?:\/\//i.test(assignmentFile.filePath)) {
    return NextResponse.redirect(assignmentFile.filePath);
  }

  const file = dataUrlToFile(assignmentFile.filePath);

  if (!file) {
    return NextResponse.json({ message: "Archivo invalido." }, { status: 400 });
  }

  return new NextResponse(file.bytes, {
    headers: {
      "Content-Type": assignmentFile.fileType || file.contentType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(
        assignmentFile.fileName
      )}"`,
      "Cache-Control": "public, max-age=300",
    },
  });
};
