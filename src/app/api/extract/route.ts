import { NextResponse } from "next/server";
import { extractFeatures } from "@/lib/agents";

// [2] Gemini① 特徴抽出。資料テキスト → CaseFeatures（人が [3] で確認・修正する）。
export async function POST(req: Request) {
  try {
    const { docText } = (await req.json()) as { docText?: string };
    if (!docText || !docText.trim()) {
      return NextResponse.json({ error: "docText is required" }, { status: 400 });
    }
    const features = await extractFeatures(docText);
    return NextResponse.json({ features });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
