import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IdentifyCandidate, Seed, Warning } from "@/types/case";

// 反証役の grounding フィルタだけを検証したいので、Gemini 呼び出しはモックする。
const generateJson = vi.fn();
vi.mock("@/lib/gemini", () => ({
  generateJson: (...args: unknown[]) => generateJson(...args),
}));

const { refute } = await import("@/lib/agents");

const seed = (id: string): Seed => ({
  id,
  features: {
    material: "",
    shape: "",
    requestType: "",
    customer: "",
    isNewCustomer: false,
  },
});

const warn = (relatedCaseId: string): Warning => ({
  severity: "high",
  relatedCaseId,
  whatLooksSame: "",
  whatIsDangerouslyDifferent: "",
  actionBeforeStart: "",
});

const cand = (candidateId: string): IdentifyCandidate => ({
  candidateId,
  whatLooksSame: "",
});

describe("refute の grounding", () => {
  beforeEach(() => generateJson.mockReset());

  it("候補が無ければ Gemini を呼ばず空を返す", async () => {
    const out = await refute(seed("X").features, [], [seed("SEED-057")]);
    expect(out).toEqual([]);
    expect(generateJson).not.toHaveBeenCalled();
  });

  it("実在しないケースを根拠にした幻の警告は捨てる", async () => {
    generateJson.mockResolvedValue({
      warnings: [warn("SEED-057"), warn("SEED-999")],
    });
    const out = await refute(
      seed("X").features,
      [cand("SEED-057")],
      [seed("SEED-057")],
    );
    expect(out).toHaveLength(1);
    expect(out[0].relatedCaseId).toBe("SEED-057");
  });
});
