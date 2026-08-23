import { generateJson } from "@/lib/gemini";
import type {
  CaseFeatures,
  IdentifyCandidate,
  Seed,
  Warning,
} from "@/types/case";

// ── プロンプトはドメインの心臓。ここは初稿。§11 で現場の言い回しに磨く ──────
// 反証役（REFUTE_SYS）が主役。時間はここに集中する。

const EXTRACT_SYS = `あなたは断面研磨・故障解析の受付（intake）担当の補助AIです。
渡された資料テキストから、以下のスキーマの JSON を1つだけ返してください。

- material（材料）, shape（形状）, boardId（基盤ID・品番）, requestType（依頼種別）,
  sectionSpec（断面・カット指定）, customer（客先）, isNewCustomer（新規客か: boolean）,
  requiredPrecision（要求精度）, notes（その他）

規則：
- 書かれていないことは推測で埋めない。文字列は空文字 ""、boolean は判断できなければ false。
- 説明や前置きは一切書かず、JSON のみを返す。`;

const IDENTIFY_SYS = `あなたは「同定役」です。今回の案件の特徴（features）と、過去案件の一覧（cases）を受け取ります。
今回と「似ている／同じに見える」過去案件を、最大3件まで選びます。

- 材料・形状・基盤ID(boardId)・依頼種別などの表面的な一致を根拠にしてよい（ここでは差分は考えない）。
- 出力は次の JSON のみ：{"candidates":[{"candidateId": "<過去案件のid>", "whatLooksSame": "<どこが同じに見えるか>"}]}
- 似た案件が無ければ {"candidates":[]} を返す。JSON 以外は書かない。`;

const REFUTE_SYS = `あなたは「反証役」です。あなたの仕事は承認ではなく反証です。
同定役が「似ている」と挙げた候補について、その"同じ"を敵対的に疑い、
**"似ているのに、今回だけ危険に違う一点"** だけを警告として返します。

必ず次の3つの再発パターンを明示的にチェックしてください：
1. 新規客なのに常連扱い（実績ゼロなのに「いつも通り」の前提を流用しようとしている）。
2. 同じモノ・別依頼（基盤IDは過去と同一だが、カット位置・断面指定・依頼種別が違う。
   過去のセットアップ前提を流用すると事故る）。→ この食い違いは必ず severity "high" で拾う。
3. 資料-実物ズレ常習の類型（その材料/形状/基盤IDは、過去に資料値と実物がズレて事故った履歴がある）。

厳守：
- 危険な差分が無ければ、警告を出さない（空配列を返す）。沈黙できることが賢さです。
- 各警告は必ず relatedCaseId（根拠にした過去案件のid）を持つ。根拠のない警告は禁止。
- 中身の物理予測はしない。断面を磨いて初めて見えるものを当ててはいけない。
  出せるのは「パターンレベルの疑い」と「着手前の確認事項」だけ。
- 出力は次の JSON のみ：
  {"warnings":[{"severity":"high|medium|low","relatedCaseId":"...","whatLooksSame":"...","whatIsDangerouslyDifferent":"...","actionBeforeStart":"..."}]}
  JSON 以外は書かない。`;

// Gemini① 特徴抽出：資料テキスト → CaseFeatures。
export async function extractFeatures(docText: string): Promise<CaseFeatures> {
  return generateJson<CaseFeatures>({
    systemInstruction: EXTRACT_SYS,
    userText: docText,
  });
}

// 同定役：似た過去案件を最大3件、理由つきで。
export async function identify(
  features: CaseFeatures,
  cases: Seed[],
): Promise<IdentifyCandidate[]> {
  const out = await generateJson<{ candidates: IdentifyCandidate[] }>({
    systemInstruction: IDENTIFY_SYS,
    userText: JSON.stringify({ features, cases }, null, 2),
  });
  return out.candidates ?? [];
}

// 反証役（主役）：候補の「同じ」を叩き、危険な差分だけ返す。差分ゼロなら空配列。
export async function refute(
  features: CaseFeatures,
  candidates: IdentifyCandidate[],
  cases: Seed[],
): Promise<Warning[]> {
  if (candidates.length === 0) return [];
  const relatedCases = cases.filter((c) =>
    candidates.some((k) => k.candidateId === c.id),
  );
  const out = await generateJson<{ warnings: Warning[] }>({
    systemInstruction: REFUTE_SYS,
    userText: JSON.stringify({ features, candidates, relatedCases }, null, 2),
  });
  // 堀の担保：反証役に実際に渡した過去案件だけを根拠に許す。
  // モデルが存在しない relatedCaseId を混ぜても、幻の引用は捨てる
  // （「根拠のない警告は禁止」を server 側で強制する）。
  const groundedIds = new Set(relatedCases.map((c) => c.id));
  return (out.warnings ?? []).filter((w) => groundedIds.has(w.relatedCaseId));
}
