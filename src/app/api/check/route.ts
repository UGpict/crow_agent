import { NextResponse } from "next/server";
import { identify, refute } from "@/lib/agents";
import { featureKey } from "@/lib/featureKey";
import {
  filterSuppressed,
  getCached,
  loadCases,
  loadSuppress,
  setCached,
} from "@/lib/store";
import type { CaseFeatures } from "@/types/case";

// [4] 二段エージェント照合。既知パターンは cache.json で即答（Geminiを叩かない）。
export async function POST(req: Request) {
  try {
    const { features } = (await req.json()) as { features?: CaseFeatures };
    if (!features) {
      return NextResponse.json({ error: "features is required" }, { status: 400 });
    }

    const key = featureKey(features);
    const suppressed = await loadSuppress(key);

    const cached = await getCached(key);
    if (cached) {
      return NextResponse.json({
        warnings: filterSuppressed(cached, suppressed),
        fromCache: true,
        key,
      });
    }

    const cases = await loadCases();
    const candidates = await identify(features, cases);
    const warnings = await refute(features, candidates, cases);

    // キャッシュには生の判定を残し、抑制は返す直前に適用する。
    await setCached(key, warnings);
    return NextResponse.json({
      warnings: filterSuppressed(warnings, suppressed),
      fromCache: false,
      candidates,
      key,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
