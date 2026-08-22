// 抽出＆照合に使う特徴。§5.1 の暫定スキーマ。現場基準の確定は §11 TODO。
export type CaseFeatures = {
  material: string; // 材料（例: 樹脂封止 / セラミック基板）
  shape: string; // 形状
  boardId?: string; // 基盤ID・品番（「同じモノ」判定の鍵）
  requestType: string; // 依頼種別（例: 断面観察 / 特定カット / SEM用試料）
  sectionSpec?: string; // 断面・カット指定（例: A-A' / B-B'）
  customer: string; // 客先
  isNewCustomer: boolean; // 新規客か（過信フラグの鍵）
  requiredPrecision?: string; // 要求精度
  notes?: string; // その他フリー
};

// 過去の「同じに見えて違った／事故った」実例。逸脱層の燃料。
export type Seed = {
  id: string;
  features: CaseFeatures;
  whatDocSaid?: string; // 資料が言っていたこと
  whatActuallyHappened?: string; // 実際に起きたこと
  recurrenceKey?: string; // 再発の鍵（何を疑えば防げたか）
  lesson?: string; // 教訓
};

// 同定役の出力：どこが「同じに見える」か。
export type IdentifyCandidate = {
  candidateId: string;
  whatLooksSame: string;
};

// 反証役の出力：今回だけ危険に違う一点。root なし禁止（relatedCaseId 必須）。
export type Warning = {
  severity: "high" | "medium" | "low";
  relatedCaseId: string; // 根拠にした過去案件（必須）
  whatLooksSame: string; // 同定：どこが「同じに見える」か
  whatIsDangerouslyDifferent: string; // ★逸脱：今回の危険な差分（主役）
  actionBeforeStart: string; // 着手前にすべき確認
};
