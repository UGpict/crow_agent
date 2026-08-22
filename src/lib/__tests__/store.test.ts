import { describe, expect, it } from "vitest";
import { filterSuppressed } from "@/lib/store";
import type { Warning } from "@/types/case";

function w(relatedCaseId: string): Warning {
  return {
    severity: "high",
    relatedCaseId,
    whatLooksSame: "",
    whatIsDangerouslyDifferent: "",
    actionBeforeStart: "",
  };
}

describe("filterSuppressed", () => {
  it("抑制リストが空なら素通しする", () => {
    const ws = [w("SEED-057"), w("SEED-058")];
    expect(filterSuppressed(ws, [])).toBe(ws);
  });

  it("抑制された根拠(relatedCaseId)の警告だけを落とす", () => {
    const ws = [w("SEED-057"), w("SEED-058")];
    const out = filterSuppressed(ws, ["SEED-057"]);
    expect(out).toHaveLength(1);
    expect(out[0].relatedCaseId).toBe("SEED-058");
  });

  it("該当がなければ何も落とさない", () => {
    const ws = [w("SEED-057")];
    expect(filterSuppressed(ws, ["SEED-999"])).toHaveLength(1);
  });
});
