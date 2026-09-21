export interface CsvJobRow {
  title: string;
  company: string;
  url: string;
  location: string;
  salary: string;
  notes: string;
  status: string;
  jdText: string;
}

function parseLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function parseCsv(text: string): CsvJobRow[] {
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]).map(normalizeHeader);
  const index = (names: string[]): number => {
    for (const name of names) {
      const i = headers.findIndex((h) => h === normalizeHeader(name));
      if (i >= 0) return i;
    }
    return -1;
  };

  const titleIdx = index(["title", "role", "jobtitle", "position"]);
  const companyIdx = index(["company", "employer", "organization"]);
  if (titleIdx < 0 || companyIdx < 0) return [];

  const urlIdx = index(["url", "link", "postingurl"]);
  const locationIdx = index(["location", "city", "place"]);
  const salaryIdx = index(["salary", "compensation", "pay"]);
  const notesIdx = index(["notes", "note", "comment"]);
  const statusIdx = index(["status", "stage"]);
  const jdIdx = index(["jobdescription", "description", "jd", "details"]);

  return lines.slice(1).flatMap((line) => {
    const cells = parseLine(line);
    const title = (cells[titleIdx] ?? "").trim();
    const company = (cells[companyIdx] ?? "").trim();
    if (!title || !company) return [];
    return [
      {
        title,
        company,
        url: (urlIdx >= 0 ? cells[urlIdx] ?? "" : "").trim(),
        location: (locationIdx >= 0 ? cells[locationIdx] ?? "" : "").trim(),
        salary: (salaryIdx >= 0 ? cells[salaryIdx] ?? "" : "").trim(),
        notes: (notesIdx >= 0 ? cells[notesIdx] ?? "" : "").trim(),
        status: (statusIdx >= 0 ? cells[statusIdx] ?? "" : "").trim().toLowerCase(),
        jdText: (jdIdx >= 0 ? cells[jdIdx] ?? "" : "").trim(),
      },
    ];
  });
}
