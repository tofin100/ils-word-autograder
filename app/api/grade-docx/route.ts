import { NextResponse } from "next/server";
import { gradeDocx } from "../../../grade-docx";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const assignmentId = String(form.get("assignmentId") || "LEF04");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded (field name must be 'file')." }, { status: 400 });
    }

    const buf = await file.arrayBuffer();
    const result = await gradeDocx(buf, assignmentId);

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}