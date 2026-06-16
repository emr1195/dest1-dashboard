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
  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: params.id },
    select: { fileName: true, filePath: true, fileType: true },
  });

  if (!submission) {
    return NextResponse.json({ message: "Archivo no encontrado." }, { status: 404 });
  }

  if (/^https?:\/\//i.test(submission.filePath)) {
    return NextResponse.redirect(submission.filePath);
  }

  const file = dataUrlToFile(submission.filePath);

  if (!file) {
    return NextResponse.json({ message: "Archivo invalido." }, { status: 400 });
  }

  return new NextResponse(file.bytes, {
    headers: {
      "Content-Type": submission.fileType || file.contentType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(
        submission.fileName
      )}"`,
      "Cache-Control": "public, max-age=300",
    },
  });
};
