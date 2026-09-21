import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

export const runtime = "nodejs";

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const rawLine of text.replace(/\r\n/g, "\n").split("\n")) {
    if (!rawLine.trim()) {
      lines.push("");
      continue;
    }
    const words = rawLine.split(/\s+/);
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { text?: unknown; title?: unknown };
    const text = typeof body.text === "string" ? body.text : "";
    const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Resume";

    if (text.trim().length < 10) {
      return NextResponse.json({ error: "Resume text is too short." }, { status: 400 });
    }

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const pageWidth = 612;
    const pageHeight = 792;
    const margin = 56;
    const maxWidth = pageWidth - margin * 2;
    const size = 11;
    const lineHeight = 16;

    const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    let page = doc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const ensureSpace = (needed: number) => {
      if (y - needed < margin) {
        page = doc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
    };

    page.drawText(title, { x: margin, y, size: 18, font: bold, color: rgb(0.11, 0.17, 0.28) });
    y -= 28;

    for (const paragraph of paragraphs) {
      const isHeader = /^[A-Z][A-Z\s&/-]{2,}$/.test(paragraph) || /^(SUMMARY|SKILLS|EXPERIENCE|EDUCATION|PROJECTS|INTERNSHIPS|TARGETED PROFILE|CORE SKILLS)$/i.test(paragraph);
      const lines = wrapText(paragraph, font, size, maxWidth);
      for (const line of lines) {
        ensureSpace(lineHeight);
        page.drawText(line, {
          x: margin,
          y,
          size,
          font: isHeader ? bold : font,
          color: isHeader ? rgb(0.11, 0.29, 0.85) : rgb(0.15, 0.22, 0.32),
        });
        y -= lineHeight;
      }
      y -= isHeader ? 5 : 3;
    }

    const pdfBytes = await doc.save();
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(title)}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[api/export-resume]", err);
    const message = err instanceof Error ? err.message : "Could not export resume.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
