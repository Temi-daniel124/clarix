/**
 * Reading a member roster out of a spreadsheet (blueprint 2.4), MVP-SCOPE.md P0 #2.
 *
 * Deliberately dependency-free. A roster carries IPPIS numbers, names and savings balances for
 * every member of a cooperative, which is exactly the category `docs/TOOLING-POLICY.md` item 5
 * says must not reach a new library without a security read first. CSV is a few lines of code,
 * and the XLSX path below reads the two parts of the file that matter using the platform's own
 * `DecompressionStream`: no parser, no vendor, nothing that sees this data but us.
 *
 * All of it runs in the browser. Nothing is uploaded: the file never leaves the admin's machine,
 * and only the rows they confirm are sent to the database.
 */

export type ParsedSheet = {
  headers: string[];
  rows: string[][];
};

export async function parseSpreadsheet(file: File): Promise<ParsedSheet> {
  const isExcel =
    file.name.toLowerCase().endsWith(".xlsx") ||
    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  return isExcel ? parseXlsx(await file.arrayBuffer()) : parseCsv(await file.text());
}

/* ---------------------------------------------------------------------------
   CSV
--------------------------------------------------------------------------- */

/** A full CSV reader: quoted fields, escaped quotes, embedded newlines, CRLF. */
export function parseCsv(text: string): ParsedSheet {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  const body = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];

    if (quoted) {
      if (char === '"') {
        if (body[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && body[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const cleaned = rows.filter((entry) => entry.some((cell) => cell.trim().length > 0));
  const [headers = [], ...rest] = cleaned;

  return { headers: headers.map((header) => header.trim()), rows: rest };
}

/* ---------------------------------------------------------------------------
   XLSX
   An .xlsx file is a ZIP of XML parts. Two of them carry everything a roster needs: the first
   worksheet, and the shared-strings table its text cells point into.
--------------------------------------------------------------------------- */

async function parseXlsx(buffer: ArrayBuffer): Promise<ParsedSheet> {
  const files = await readZip(buffer);

  const sheetName =
    [...files.keys()].find((name) => /^xl\/worksheets\/sheet1\.xml$/i.test(name)) ??
    [...files.keys()].find((name) => /^xl\/worksheets\/.*\.xml$/i.test(name));

  if (!sheetName) throw new Error("no worksheet");

  const sheetXml = new TextDecoder().decode(files.get(sheetName)!);
  const sharedXml = files.has("xl/sharedStrings.xml")
    ? new TextDecoder().decode(files.get("xl/sharedStrings.xml")!)
    : "";

  const shared = readSharedStrings(sharedXml);
  const grid: string[][] = [];

  for (const rowMatch of sheetXml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: string[] = [];

    for (const cellMatch of rowMatch[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attributes = cellMatch[1];
      const body = cellMatch[2];

      const reference = /r="([A-Z]+)\d+"/.exec(attributes)?.[1];
      const columnIndex = reference ? columnToIndex(reference) : cells.length;
      const type = /t="([^"]+)"/.exec(attributes)?.[1];

      let value = "";
      if (type === "inlineStr") {
        value = stripTags(body);
      } else {
        const raw = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "";
        value = type === "s" ? (shared[Number(raw)] ?? "") : decodeEntities(raw);
      }

      while (cells.length < columnIndex) cells.push("");
      cells[columnIndex] = value;
    }

    grid.push(cells);
  }

  const cleaned = grid.filter((entry) => entry.some((cell) => cell.trim().length > 0));
  const [headers = [], ...rest] = cleaned;

  return { headers: headers.map((header) => header.trim()), rows: rest };
}

function readSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  for (const match of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    strings.push(stripTags(match[1]));
  }
  return strings;
}

function stripTags(fragment: string): string {
  // <t> runs are concatenated, which is how Excel stores a cell with mixed formatting.
  const parts = [...fragment.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((match) => match[1]);
  return decodeEntities(parts.join(""));
}

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&");
}

function columnToIndex(reference: string): number {
  let index = 0;
  for (const char of reference) {
    index = index * 26 + (char.charCodeAt(0) - 64);
  }
  return index - 1;
}

/* ---------------------------------------------------------------------------
   A minimal ZIP reader, enough for the parts an .xlsx keeps, and nothing else.
--------------------------------------------------------------------------- */

async function readZip(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const files = new Map<string, Uint8Array>();

  // The central directory is found from the end-of-central-directory record, which sits in the
  // last 64KB. Reading the directory rather than scanning local headers is what makes the offsets
  // trustworthy on files written by Excel, LibreOffice and Google Sheets alike.
  let endOffset = -1;
  for (let index = bytes.length - 22; index >= Math.max(0, bytes.length - 66_000); index -= 1) {
    if (view.getUint32(index, true) === 0x06054b50) {
      endOffset = index;
      break;
    }
  }
  if (endOffset < 0) throw new Error("not a zip");

  const entryCount = view.getUint16(endOffset + 10, true);
  let pointer = view.getUint32(endOffset + 16, true);

  for (let entry = 0; entry < entryCount; entry += 1) {
    if (view.getUint32(pointer, true) !== 0x02014b50) break;

    const method = view.getUint16(pointer + 10, true);
    const compressedSize = view.getUint32(pointer + 20, true);
    const nameLength = view.getUint16(pointer + 28, true);
    const extraLength = view.getUint16(pointer + 30, true);
    const commentLength = view.getUint16(pointer + 32, true);
    const localOffset = view.getUint32(pointer + 42, true);

    const name = new TextDecoder().decode(
      bytes.subarray(pointer + 46, pointer + 46 + nameLength),
    );

    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const data = bytes.subarray(dataStart, dataStart + compressedSize);

    if (name === "xl/sharedStrings.xml" || /^xl\/worksheets\/.*\.xml$/i.test(name)) {
      files.set(name, method === 0 ? data : await inflateRaw(data));
    }

    pointer += 46 + nameLength + extraLength + commentLength;
  }

  return files;
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
