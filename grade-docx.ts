import { extractBlueText } from "./extract-blue-text";
import { gradeAnswers, type Solution, type StudentAnswer } from "./grader";

// Node-only: reading the solution JSON from the repo root
import fs from "fs";
import path from "path";

export type GradeDocxResponse = {
  assignmentId: string;
  extracted: StudentAnswer[];
  graded: ReturnType<typeof gradeAnswers>;
  summary: {
    total: number;
    correct: number;
    wrong: number;
    missing: number;
  };
};

function loadSolution(assignmentId: string): Solution {
  const filename =
    assignmentId === "LEF04" ? "solution-LEF04.json" : `solution-${assignmentId}.json`;

  const filePath = path.join(process.cwd(), filename);
  const raw = fs.readFileSync(filePath, "utf8");

  const parsed = JSON.parse(raw);

  // Basic shape validation (lightweight, keeps MVP stable)
  if (!parsed?.assignmentId || !parsed?.grading || !Array.isArray(parsed?.answers)) {
    throw new Error(`Invalid solution file format: ${filename}`);
  }

  return parsed as Solution;
}

export async function gradeDocx(
  docxBuffer: ArrayBuffer,
  assignmentId: string = "LEF04"
): Promise<GradeDocxResponse> {
  const solution = loadSolution(assignmentId);

  // 1) extract blue answers from docx
  const extracted = await extractBlueText(docxBuffer);

  // convert to StudentAnswer type used in grader.ts
  const studentAnswers: StudentAnswer[] = extracted.map((a) => ({
    index: a.index,
    text: a.text,
  }));

  // 2) grade
  const graded = gradeAnswers(studentAnswers, solution);

  // 3) summary
  const correct = graded.filter((r) => r.correct).length;
  const wrong = graded.filter((r) => !r.correct && r.reason === "wrong").length;
  const missing = graded.filter((r) => r.reason === "missing").length;

  return {
    assignmentId,
    extracted: studentAnswers,
    graded,
    summary: {
      total: graded.length,
      correct,
      wrong,
      missing,
    },
  };
}