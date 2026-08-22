<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## このリポジトリの芯（実装で迷ったら）

- プロダクトの背骨：**「同じミスは、二度と繰り返さない。」**
- 心臓は**逸脱層**（`lib/agents.ts` の反証役）。「似ている」を出すだけの同定は table-stakes。
  時間は反証役＝"似てるのに今回だけ危険に違う一点"を名指す部分に集中する。
- Gemini 呼び出しは **`src/lib/gemini.ts` の1ファイルに閉じ込める**（後で Vertex AI に差し替え可能に保つ）。
- 各エージェントの出力は **JSON のみ**を強制し、`try/catch` で安全にパースする。
- やらないこと：中身の物理予測／画像からの内部構造推定。最終判断は必ず人間。
- 詳細な思想と仕様は `docs/design-v0.1.md`。
