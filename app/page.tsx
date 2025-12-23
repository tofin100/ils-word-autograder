"use client";

import { useState } from "react";

type GradeResult = {
  index: number;
  student: string;
  correct: boolean;
  expected: string[];
  reason: "exact" | "typo" | "wrong" | "missing";
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [assignmentId, setAssignmentId] = useState("LEF04");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  async function handleGrade() {
    setError(null);
    setData(null);

    if (!file) {
      setError("Bitte eine .docx Datei auswählen.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("assignmentId", assignmentId);

      const res = await fetch("/api/grade-docx", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok) throw new Error(json?.error || "Request failed");
      setData(json);
    } catch (e: any) {
      setError(e?.message ?? "Fehler");
    } finally {
      setLoading(false);
    }
  }

  const graded: GradeResult[] = data?.graded ?? [];
  const summary = data?.summary;

  return (
    <main style={{ maxWidth: 1100, margin: "50px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 34, fontWeight: 800, marginBottom: 8 }}>ILS Word Auto-Korrektur (MVP)</h1>
      <p style={{ opacity: 0.75, marginBottom: 22 }}>
        Upload einer <b>.docx</b> Einsendeaufgabe → blaue Antworten extrahieren → Abgleich mit Musterlösung.
      </p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          Assignment:
          <input
            value={assignmentId}
            onChange={(e) => setAssignmentId(e.target.value)}
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", width: 180 }}
          />
        </label>

        <input type="file" accept=".docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />

        <button
          onClick={handleGrade}
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #ddd",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Auswerten…" : "Auswerten"}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 16, padding: 12, borderRadius: 12, background: "#ffecec", border: "1px solid #ffb3b3" }}>
          {error}
        </div>
      )}

      {summary && (
        <div style={{ marginTop: 18, padding: 14, borderRadius: 14, background: "#f6f7fb", border: "1px solid #e5e7eb" }}>
          <b>Summary:</b> {summary.correct} korrekt / {summary.wrong} falsch / {summary.missing} fehlend (Total: {summary.total})
        </div>
      )}

      {graded.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Ergebnis</h2>

          <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 14 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#0b1220", color: "white" }}>
                  <th style={{ textAlign: "left", padding: 12 }}>#</th>
                  <th style={{ textAlign: "left", padding: 12 }}>Schülerantwort</th>
                  <th style={{ textAlign: "left", padding: 12 }}>Soll</th>
                  <th style={{ textAlign: "left", padding: 12 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {graded.map((r) => (
                  <tr key={r.index} style={{ borderTop: "1px solid #e5e7eb" }}>
                    <td style={{ padding: 12, fontWeight: 700 }}>{r.index}</td>
                    <td style={{ padding: 12 }}>{r.student || <span style={{ opacity: 0.5 }}>—</span>}</td>
                    <td style={{ padding: 12 }}>{r.expected?.join(" | ")}</td>
                    <td style={{ padding: 12, fontWeight: 700 }}>
                      {r.correct ? (r.reason === "typo" ? "✅ (Tippfehler)" : "✅ korrekt") : (r.reason === "missing" ? "⚠️ fehlt" : "❌ falsch")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ marginTop: 10, opacity: 0.6 }}>
            Der MVP bewertet aktuell nur so viele Items, wie in <code>solution-LEF04.json</code> stehen.
          </p>
        </div>
      )}
    </main>
  );
}