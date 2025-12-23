/**
 * Extracts all blue-colored text segments from a .docx file
 * Returns them in reading order
 */

export type ExtractedAnswer = {
  index: number;
  text: string;
};

export async function extractBlueText(
  fileBuffer: ArrayBuffer
): Promise<ExtractedAnswer[]> {
  // LOGIC COMES NEXT
  return [];
}