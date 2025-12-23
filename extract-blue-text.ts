import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";

export type ExtractedAnswer = {
  index: number;
  text: string;
};

function toArray<T>(x: T | T[] | undefined | null): T[] {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

function getTextFromRun(run: any): string {
  // Word stores text in <w:t> (can be string, object, or array)
  const t = run?.["w:t"];
  if (!t) return "";

  if (typeof t === "string") return t;

  if (Array.isArray(t)) {
    return t
      .map((v) => (typeof v === "string" ? v : v?.["#text"] ?? ""))
      .join("");
  }

  if (typeof t === "object") {
    return t?.["#text"] ?? "";
  }

  return "";
}

function runIsBlue(run: any): boolean {
  const rPr = run?.["w:rPr"];
  if (!rPr) return false;

  const color = rPr?.["w:color"];
  const themeColor = rPr?.["w:color"]?.["@_w:themeColor"] ?? rPr?.["w:color"]?.["@_themeColor"];

  // w:color can look like: { "@_w:val": "3366FF" } or { "@_val": "0000FF" }
  const raw =
    typeof color === "string"
      ? color
      : color?.["@_w:val"] || color?.["@_val"] || themeColor;

  if (!raw) return false;

  const v = String(raw).toUpperCase();

  // Common blues + the one in your sample (e.g. 3366FF).
  // Add more if your templates use other blues.
  const BLUE_HEX = new Set(["0000FF", "0070C0", "2F75B5", "1F4E79", "3366FF"]);

  if (BLUE_HEX.has(v)) return true;

  // Sometimes Word uses theme colors like ACCENT1, ACCENT2 etc.
  if (v.includes("ACCENT")) return true;

  return false;
}

/**
 * Extracts all blue-colored text segments from a .docx file in reading order.
 * Treats continuous blue runs as one answer; switches to non-blue flushes the answer.
 */
export async function extractBlueText(fileBuffer: ArrayBuffer): Promise<ExtractedAnswer[]> {
  const zip = await JSZip.loadAsync(fileBuffer);

  const docXml = await zip.file("word/document.xml")?.async("string");
  if (!docXml) throw new Error("word/document.xml not found. Is this a .docx file?");

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    preserveOrder: false,
  });

  const doc = parser.parse(docXml);

  const body = doc?.["w:document"]?.["w:body"];
  if (!body) return [];

  const paragraphs = toArray(body["w:p"]);

  const answers: string[] = [];
  let collecting = false;
  let current = "";

  const flush = () => {
    const cleaned = current.replace(/\u00A0/g, " ").trim();
    if (cleaned.length > 0) answers.push(cleaned);
    current = "";
    collecting = false;
  };

  for (const p of paragraphs) {
    const runs = toArray(p?.["w:r"]);

    for (const r of runs) {
      const isBlue = runIsBlue(r);
      const txt = getTextFromRun(r);

      if (isBlue) {
        collecting = true;
        current += txt;
      } else {
        // End of a blue segment
        if (collecting) flush();
      }
    }

    // Paragraph boundary also ends an answer
    if (collecting) flush();
  }

  return answers.map((text, i) => ({ index: i + 1, text }));
}