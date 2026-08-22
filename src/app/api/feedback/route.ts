import { NextResponse } from "next/server";
import { loadHitRate, recordFeedback } from "@/lib/store";

// [6.5] 自己監視：警告が「役立った／誤検知」を1クリックで記録し、的中率を集計。
export async function POST(req: Request) {
  try {
    const { kind } = (await req.json()) as {
      kind?: "helpful" | "falsePositive";
    };
    if (kind !== "helpful" && kind !== "falsePositive") {
      return NextResponse.json(
        { error: "kind must be 'helpful' or 'falsePositive'" },
        { status: 400 },
      );
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
