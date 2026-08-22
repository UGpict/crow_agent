"use client";

import { useState } from "react";
import type { CaseFeatures, Warning } from "@/types/case";

type Step = "input" | "confirm" | "result";

const EMPTY: CaseFeatures = {
  material: "",
  shape: "",
  boardId: "",
  requestType: "",
  sectionSpec: "",
  customer: "",
  isNewCustomer: false,
  requiredPrecision: "",
  notes: "",
};

const SEVERITY_STYLE: Record<Warning["severity"], string> = {
  high: "border-red-500 bg-red-500/10",
  medium: "border-amber-400 bg-amber-400/10",
  low: "border-slate-400 bg-slate-400/10",
};

export default function Home() {
  const [step, setStep] = useState<Step>("input");
  const [docText, setDocText] = useState("");
  const [features, setFeatures] = useState<CaseFeatures>(EMPTY);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runExtract() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "抽出に失敗しました");
      setFeatures({ ...EMPTY, ...data.features });
      setStep("confirm");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function runCheck() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "照合に失敗しました");
      setWarnings(data.warnings ?? []);
      setFromCache(Boolean(data.fromCache));
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function sendFeedback(kind: "helpful" | "falsePositive") {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    });
  }

  function reset() {
    setStep("input");
    setWarnings([]);
    setFromCache(false);
    setError(null);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          カラス <span className="text-cyan-400">Crow</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          「いつも通り」の過信を、着手前に止めるブレーキ。同じミスは、二度と繰り返さない。
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-md border border-red-500 bg-red-500/10 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {step === "input" && (
        <section>
          <label className="mb-2 block text-sm font-medium">
            資料テキストを貼る
          </label>
          <textarea
            className="h-56 w-full resize-y rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-400"
            placeholder="受付資料（intake）の内容を貼り付け…"
            value={docText}
            onChange={(e) => setDocText(e.target.value)}
          />
          <button
            className="mt-3 rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
            onClick={runExtract}
            disabled={loading || !docText.trim()}
          >
            {loading ? "解析中…" : "解析"}
          </button>
        </section>
      )}

      {step === "confirm" && (
        <section>
          <h2 className="mb-1 text-lg font-semibold">抽出結果の確認（関所）</h2>
          <p className="mb-4 text-sm text-slate-400">
            AI が推測で埋めていないか確認し、必要なら直してから照合へ。ここでの承認が学習の入口です。
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="材料" value={features.material} onChange={(v) => setFeatures({ ...features, material: v })} />
            <Field label="形状" value={features.shape} onChange={(v) => setFeatures({ ...features, shape: v })} />
            <Field label="基盤ID" value={features.boardId ?? ""} onChange={(v) => setFeatures({ ...features, boardId: v })} />
            <Field label="依頼種別" value={features.requestType} onChange={(v) => setFeatures({ ...features, requestType: v })} />
            <Field label="断面・カット指定" value={features.sectionSpec ?? ""} onChange={(v) => setFeatures({ ...features, sectionSpec: v })} />
            <Field label="客先" value={features.customer} onChange={(v) => setFeatures({ ...features, customer: v })} />
            <Field label="要求精度" value={features.requiredPrecision ?? ""} onChange={(v) => setFeatures({ ...features, requiredPrecision: v })} />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={features.isNewCustomer}
                onChange={(e) => setFeatures({ ...features, isNewCustomer: e.target.checked })}
              />
              新規客
            </label>
          </div>
          <Field
            label="その他メモ"
            value={features.notes ?? ""}
            onChange={(v) => setFeatures({ ...features, notes: v })}
            className="mt-3"
          />
          <div className="mt-4 flex gap-3">
            <button
              className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
              onClick={runCheck}
              disabled={loading}
            >
              {loading ? "照合中…" : "この内容で照合する"}
            </button>
            <button className="rounded-md border border-slate-600 px-4 py-2 text-sm" onClick={reset}>
              やり直す
            </button>
          </div>
        </section>
      )}

      {step === "result" && (
        <section>
          <div className="mb-3 flex items-center gap-3">
            <h2 className="text-lg font-semibold">カラスの警告</h2>
            {fromCache && (
              <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs">既知・即答</span>
            )}
          </div>

          {warnings.length === 0 ? (
            <p className="rounded-md border border-emerald-500 bg-emerald-500/10 px-4 py-3 text-sm">
              危険な差分は見つかりませんでした。（沈黙）— 似た過去に対し、今回とくに危険に違う点はありません。
            </p>
          ) : (
            <ul className="space-y-3">
              {warnings.map((w, i) => (
                <li key={i} className={`rounded-lg border px-4 py-3 ${SEVERITY_STYLE[w.severity]}`}>
                  <div className="mb-1 flex items-center gap-2 text-xs">
                    <span className="font-bold uppercase">{w.severity}</span>
                    <span className="text-slate-400">根拠: {w.relatedCaseId}</span>
                  </div>
                  <p className="text-base font-semibold text-red-200">
                    ⚠ {w.whatIsDangerouslyDifferent}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">似ている点: {w.whatLooksSame}</p>
                  <p className="mt-1 text-sm">
                    <span className="font-semibold text-cyan-300">着手前の確認:</span> {w.actionBeforeStart}
                  </p>
                  <div className="mt-2 flex gap-2 text-xs">
                    <button className="rounded border border-slate-500 px-2 py-1" onClick={() => sendFeedback("helpful")}>
                      役立った
                    </button>
                    <button className="rounded border border-slate-500 px-2 py-1" onClick={() => sendFeedback("falsePositive")}>
                      誤検知
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-xs text-amber-300">
            最終判断は担当者が行ってください。カラスは確認を促す提案役です。
          </p>
          <button className="mt-4 rounded-md border border-slate-600 px-4 py-2 text-sm" onClick={reset}>
            新しい案件を見る
          </button>
        </section>
      )}
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block text-slate-400">{label}</span>
      <input
        className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 outline-none focus:border-cyan-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
