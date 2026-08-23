import { NextResponse } from "next/server";
import { appendLog, clearCache } from "@/lib/store";
import type { CaseFeatures, Seed } from "@/types/case";

// [6] 学習ループを閉じる：起きたミスを log.json に追記し、次回の照合対象に加える。
// これがプロダクトの背骨「同じミスは、二度と繰り返さない」の実体。
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      features?: CaseFeatures;
      whatDocSaid?: string;
      whatActuallyHappened?: string;
      recurrenceKey?: string;
      lesson?: string;
    };
    if (!body.features) {
      return NextResponse.json(
        { error: "features is required" },
        { status: 400 },
      );
    }

    const trim = (s?: string) => {
      const t = (s ?? "").trim();
      return t.length > 0 ? t : undefined;
    };

    const seed: Seed = {
      id: `LOG-${Date.now()}`,
      features: body.features,
      whatDocSaid: trim(body.whatDocSaid),
      whatActuallyHappened: trim(body.whatActuallyHappened),
      recurrenceKey: trim(body.recurrenceKey),
      lesson: trim(body.lesson),
    };

    await appendLog(seed);
    await clearCache(); // 照合対象が増えたので、古い即答は破棄して再評価させる。

    return NextResponse.json({ ok: true, id: seed.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
