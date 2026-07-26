/**
 * Shared building blocks for the generated Word deliverables.
 *
 * The .docx files are treated as build output: they are regenerated from these
 * scripts rather than hand-edited, so the plan/spec/style guide can be kept
 * current cheaply as the project evolves.
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * Where the Word deliverables are written. These live in the synced Google
 * Drive project folder (not the code repo) so they can be opened from any
 * device, while the repo itself stays local for performance.
 */
export const DOCS_DIR =
  process.env.DOCS_DIR ??
  join(
    process.env.HOME ?? "",
    "Library/CloudStorage/GoogleDrive-akaheto@gmail.com/My Drive/Claude/Code/Exercise Partner",
  );

export const BRAND = {
  /** Deep slate — primary text and headings. */
  ink: "0F172A",
  /** Muted slate — secondary/supporting text. */
  muted: "64748B",
  /** Accent used for H1/H2 rules and table headers. */
  accent: "0D9488",
  /** Table header fill. */
  headerFill: "F1F5F9",
} as const;

export const STATUS = {
  notStarted: "🔲",
  inProgress: "🟡",
  done: "✅",
  blocked: "⛔",
} as const;

export function title(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text, bold: true, size: 44, color: BRAND.ink, font: "Calibri" }),
    ],
  });
}

export function subtitle(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 320 },
    children: [
      new TextRun({ text, size: 20, color: BRAND.muted, font: "Calibri", italics: true }),
    ],
  });
}

export function h1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND.accent, space: 4 },
    },
    children: [
      new TextRun({ text, bold: true, size: 30, color: BRAND.ink, font: "Calibri" }),
    ],
  });
}

export function h2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [
      new TextRun({ text, bold: true, size: 24, color: BRAND.accent, font: "Calibri" }),
    ],
  });
}

export function h3(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({ text, bold: true, size: 22, color: BRAND.ink, font: "Calibri" }),
    ],
  });
}

/** Body paragraph. Pass `muted` for supporting/secondary copy. */
export function p(text: string, opts: { muted?: boolean; italics?: boolean } = {}): Paragraph {
  return new Paragraph({
    spacing: { after: 120, line: 276 },
    children: [
      new TextRun({
        text,
        size: 21,
        color: opts.muted ? BRAND.muted : BRAND.ink,
        italics: opts.italics,
        font: "Calibri",
      }),
    ],
  });
}

/**
 * Paragraph supporting inline bold via `**marker**` segments, so key terms can
 * be emphasised without hand-building TextRun arrays at every call site.
 */
export function rich(text: string): Paragraph {
  const children = text.split(/(\*\*[^*]+\*\*)/g)
    .filter((segment) => segment.length > 0)
    .map((segment) => {
      const bold = segment.startsWith("**") && segment.endsWith("**");
      return new TextRun({
        text: bold ? segment.slice(2, -2) : segment,
        bold,
        size: 21,
        color: BRAND.ink,
        font: "Calibri",
      });
    });
  return new Paragraph({ spacing: { after: 120, line: 276 }, children });
}

export function bullet(text: string, level = 0): Paragraph {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 60, line: 276 },
    children: [new TextRun({ text, size: 21, color: BRAND.ink, font: "Calibri" })],
  });
}

export function numbered(text: string, level = 0): Paragraph {
  return new Paragraph({
    numbering: { reference: "ordered", level },
    spacing: { after: 60, line: 276 },
    children: [new TextRun({ text, size: 21, color: BRAND.ink, font: "Calibri" })],
  });
}

export function spacer(): Paragraph {
  return new Paragraph({ spacing: { after: 120 }, children: [] });
}

function cell(text: string, opts: { header?: boolean; width?: number } = {}): TableCell {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.header
      ? { type: ShadingType.CLEAR, fill: BRAND.headerFill, color: "auto" }
      : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        spacing: { after: 0, line: 260 },
        children: [
          new TextRun({
            text,
            bold: opts.header,
            size: 20,
            color: opts.header ? BRAND.ink : BRAND.ink,
            font: "Calibri",
          }),
        ],
      }),
    ],
  });
}

/**
 * Build a bordered table. `widths` are percentages and must align with the
 * header count; omit to let Word distribute columns evenly.
 */
export function table(headers: string[], rows: string[][], widths?: number[]): Table {
  const border = { style: BorderStyle.SINGLE, size: 2, color: "E2E8F0" };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: border,
      bottom: border,
      left: border,
      right: border,
      insideHorizontal: border,
      insideVertical: border,
    },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((headerText, i) =>
          cell(headerText, { header: true, width: widths?.[i] }),
        ),
      }),
      ...rows.map(
        (row) =>
          new TableRow({
            children: row.map((value, i) => cell(value, { width: widths?.[i] })),
          }),
      ),
    ],
  });
}

/** Callout used for assumptions and "read this first" notes. */
export function callout(label: string, text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 120, after: 160, line: 276 },
    shading: { type: ShadingType.CLEAR, fill: "F8FAFC", color: "auto" },
    border: {
      left: { style: BorderStyle.SINGLE, size: 12, color: BRAND.accent, space: 8 },
    },
    indent: { left: 120 },
    children: [
      new TextRun({ text: `${label}  `, bold: true, size: 20, color: BRAND.accent, font: "Calibri" }),
      new TextRun({ text, size: 20, color: BRAND.ink, font: "Calibri" }),
    ],
  });
}

export function footer(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 480 },
    children: [
      new TextRun({ text, size: 18, color: BRAND.muted, italics: true, font: "Calibri" }),
    ],
  });
}

/** Formats a date as e.g. "26 July 2026" for document headers. */
export function formatDate(date = new Date()): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Wrap content in a Document with consistent page setup and numbering. */
export function buildDocument(children: (Paragraph | Table)[]): Document {
  return new Document({
    numbering: {
      config: [
        {
          reference: "ordered",
          levels: [
            { level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.START },
            { level: 1, format: "lowerLetter", text: "%2.", alignment: AlignmentType.START },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 21, color: BRAND.ink } },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } },
        },
        children,
      },
    ],
  });
}

/** Render a Document to disk, creating the output directory if needed. */
export async function writeDocx(fileName: string, doc: Document): Promise<string> {
  const outPath = join(DOCS_DIR, fileName);
  await mkdir(dirname(outPath), { recursive: true });
  const buffer = await Packer.toBuffer(doc);
  await writeFile(outPath, buffer);
  return outPath;
}
