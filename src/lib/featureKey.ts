import type { CaseFeatures } from "@/types/case";

// 正規化キー（§6.4）：既知パターンをキャッシュで即答するための鍵。
// boardId + requestType + sectionSpec + isNewCustomer。
// 現場基準で「何が揃えば同一パターンか」を決めたら、ここを調整する（§11）。
export function featureKey(f: CaseFeatures): string {
  const norm = (s?: string) => (s ?? "").trim().toLowerCase();
  return [
    norm(f.boardId),
    norm(f.requestType),
    norm(f.sectionSpec),
    f.isNewCustomer ? "new" : "repeat",
  ].join("|");
}
