# カラス（Crow）🐦‍⬛

**「同じミスは、二度と繰り返さない。」**

断面研磨の受付（intake）で、「いつも通り」の過信による再発ミスを、着手前に見抜いて指摘するダブルチェックAI。予言者ではなく、過信を止めるブレーキ。（AI HACK 2026 向け MVP）

## セットアップ

```bash
npm install
cp .env.example .env.local   # GEMINI_API_KEY を入れる
npm run dev                  # http://localhost:3000
```

Gemini の API キーは https://aistudio.google.com/apikey で取得。

## 使い方（1画面）
1. 受付資料のテキストを貼って「解析」
2. 抽出された特徴を確認・修正（関所）
3. カラスの警告（似ているのに今回だけ危険に違う一点）を確認。最終判断は人。

## 構成
- 心臓は `src/lib/agents.ts` の**反証役**（逸脱層）。同定役→反証役の二段。
- Gemini 呼び出しは `src/lib/gemini.ts` に集約（Vertex AI へ差し替え可能）。
- 永続化は `data/*.json`（DBなし）。既知パターンは `cache.json` で即答。
- 詳細と TODO：`docs/design-v0.1.md`。

## コマンド
- `npm run dev` / `npm run build` / `npm start`
- `npm run typecheck` / `npm run lint` / `npm test`
