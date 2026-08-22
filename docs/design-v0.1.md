# カラス（Crow）MVP — 設計メモ v0.1

> 断面研磨の受付（intake）で、「いつも通り」の過信で起きる再発ミスを、着手前に見抜いて指摘するダブルチェックAI。予言者ではなく、過信を止めるブレーキ。

## 一行の約束
**「同じミスは、二度と繰り返さない。」**

## 思想（外すと別物になる）
- 価値は「過去の似た資料を検索する」ことでは **ない**（汎用RAGでできる浅い半分）。
- 心臓は **逸脱層**：似ていると分かった上で、**"今回だけ危険に違う一点"を名指す**こと。ここに実装を集中する。
- 二層構造：
  - **同定層**（table-stakes・手抜きOK）：材料・形状・基盤IDで近い過去を出す。
  - **逸脱層**（心臓）：近い過去に対する今回の危険な差分。代表3パターン →
    1. 新規客なのに常連扱い
    2. 同じモノ・別依頼（基盤同一だが断面/カット/依頼種別が違う）
    3. 資料-実物ズレ常習の類型
- やらない：中身の物理予測／画像からの内部構造推定。**最終判断は必ず人間。**

## フロー（一本道＋承認ゲート1点）
1. 資料テキストを貼る
2. Gemini① 特徴抽出 → CaseFeatures（`lib/agents.ts` extractFeatures）
3. 人が確認・修正（関所＝学習の入口） … `app/page.tsx` confirm ステップ
4. 二段エージェント照合（同定役→反証役）。既知は `cache.json` で即答（`api/check`）
5. 警告表示（`Warning[]`）
6. （任意）新しいミスを `log.json` に追記（次回の照合対象に加わる）

## 実装マップ
- `src/lib/gemini.ts` … Gemini 呼び出しを集約（API key。Vertex へ差し替え可能）
- `src/lib/agents.ts` … extractFeatures / identify（同定役）/ refute（反証役・主役）＋プロンプト
- `src/lib/featureKey.ts` … 正規化キー（boardId+requestType+sectionSpec+isNewCustomer）
- `src/lib/store.ts` … seeds+log マージ / cache / hitrate（JSON永続化）
- `src/app/api/{extract,check,feedback}/route.ts` … API
- `src/app/page.tsx` … 1画面フロー（input→confirm→result）
- `data/{seeds,log,cache,hitrate}.json` … 永続化（seeds のみ git 追跡）

## 受け入れ基準（§8）
1. 種 SEED-057（BRD-057 / A-A'）がある状態で、
2. 「BRD-057、今回は B-B' 断面で断面観察希望」を入れると、
3. 抽出で boardId=BRD-057 / sectionSpec=B-B' が出て人が確認でき、
4. 同定役が SEED-057 を挙げ、反証役が **high 警告**（断面 A-A'→B-B'、前回セットアップ前提を流用するな／基準面を再確認）を返す、
5. 無関係な intake では余計な警告を出さない（沈黙）、
6. 同じ intake の再投入は 2回目キャッシュ即答。

## 開発者（Nokotake）TODO（§11）
- [ ] 特徴スキーマの確定（`src/types/case.ts`。"何が揃えば同種か"の軸）
- [ ] 種事例を実データ3〜5件に差し替え（`data/seeds.json`。recurrenceKey と lesson が命）
- [ ] 反証役プロンプトに現場の"事故る差分"の言い回しを反映（`src/lib/agents.ts` REFUTE_SYS）
- [ ] 入力をテキストのみで進めるか、画像OCRも要るか決定（§7.4 ストレッチ）
- [ ] 客先情報を外部APIに出す範囲を上司と合意（初期は手入力／一部に絞る）

## 明示的に作らないもの（§9）
認証・ユーザー管理／外部DB／ベクトル検索・embedding／クラウドデプロイ／複数人同時利用／
中身の物理予測・画像からの内部構造推定／凝ったデザイン・凝ったエージェントフレームワーク。
