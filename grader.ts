/**
 * Compares extracted student answers with a solution definition
 * and returns a grading result per item.
 */

export type GradingRuleSet = {
  caseInsensitive: boolean;
  trim: boolean;
  ignorePunctuation: boolean;
  collapseWhitespace: boolean;
  typoTolerance: number;
};

export type SolutionItem = {
  index: number;
  accepted: string[];
};

export type Solution = {
  assignmentId: string;
  grading: GradingRuleSet;
  answers: SolutionItem[];
};

export type StudentAnswer = {
  index: number;
  text: string;
};

export type GradeResult = {
  index: number;
  student: string;
  correct: boolean;
  expected: string[];
  reason: "exact" | "typo" | "wrong" | "missing";
};

function normalize(text: string, rules: GradingRuleSet): string {
  let t = text;

  if (rules.trim) t = t.trim();
  if (rules.caseInsensitive) t = t.toLowerCase();
  if (rules.ignorePunctuation) t = t.replace(/[.,!?;:"'()\[\]{}]/g, "");
  if (rules.collapseWhitespace) t = t.replace(/\s+/g, " ");

  return t;
}

function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0
    )
  );

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

export function gradeAnswers(
  studentAnswers: StudentAnswer[],
  solution: Solution
): GradeResult[] {
  const results: GradeResult[] = [];

  for (const sol of solution.answers) {
    const student = studentAnswers.find(a => a.index === sol.index);

    if (!student) {
      results.push({
        index: sol.index,
        student: "",
        correct: false,
        expected: sol.accepted,
        reason: "missing"
      });
      continue;
    }

    const normalizedStudent = normalize(student.text, solution.grading);
    const normalizedAccepted = sol.accepted.map(a =>
      normalize(a, solution.grading)
    );

    if (normalizedAccepted.includes(normalizedStudent)) {
      results.push({
        index: sol.index,
        student: student.text,
        correct: true,
        expected: sol.accepted,
        reason: "exact"
      });
      continue;
    }

    let minDistance = Infinity;
    for (const acc of normalizedAccepted) {
      minDistance = Math.min(
        minDistance,
        levenshtein(normalizedStudent, acc)
      );
    }

    if (minDistance <= solution.grading.typoTolerance) {
      results.push({
        index: sol.index,
        student: student.text,
        correct: true,
        expected: sol.accepted,
        reason: "typo"
      });
    } else {
      results.push({
        index: sol.index,
        student: student.text,
        correct: false,
        expected: sol.accepted,
        reason: "wrong"
      });
    }
  }

  return results;
}