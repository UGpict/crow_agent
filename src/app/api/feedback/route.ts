import { NextResponse } from "next/server";
import { addSuppress, loadHitRate, recordFeedback } from "@/lib/store";

// [6.5] 自己監視：警告が「役立った／誤検知」を1クリックで記録し、的中率を集計。
// 誤検知は的中率に数えるだけでなく、同じパターンで二度と出さないよう抑制する。
export async function POST(req: Request) {
  try {
    const { kind, key, relatedCaseId } = (await req.json()) as {
      kind?: "helpful" | "falsePositive";
      key?: string;
      relatedCaseId?: string;
    };
    if (kind !== "helpful" && kind !== "falsePositive") {
      return NextResponse.json(
        { error: "kind must be 'helpful' or 'falsePositive'" },
        { status: 400 },
      );
    }
    if (kind === "falsePositive" && key && relatedCaseId) {
      await addSuppress(key, relatedCaseId);
    }
    const hitRate = await recordFeedback(kind);
    return NextResponse.json({ hitRate });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ hitRate: await loadHitRate() });
}
