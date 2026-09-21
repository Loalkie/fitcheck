import { extractText } from "unpdf";
import mammoth from "mammoth";

export interface ParsedDocument {
  text: string;
  kind: "pdf" | "docx" | "text";
}

interface ResumeFileLike {
  name: string;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export async function parseResume(file: ResumeFileLike): Promise<ParsedDocument> {
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();
  const buffer = await file.arrayBuffer();

  if (name.endsWith(".docx") || type.includes("wordprocessingml")) {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
    return { text: result.value, kind: "docx" };
  }

  if (name.endsWith(".pdf") || type === "application/pdf") {
    const result = (await extractText(new Uint8Array(buffer), { mergePages: true })) as {
      totalPages: number;
      text: string | string[];
    };
    const text = Array.isArray(result.text) ? result.text.join("\n") : result.text;
    return { text: text || "", kind: "pdf" };
  }

  const text = new TextDecoder().decode(buffer);
  return { text, kind: "text" };
}
