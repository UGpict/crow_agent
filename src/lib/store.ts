import { promises as fs } from "node:fs";
import path from "node:path";
import type { Seed, Warning } from "@/types/case";

// 永続化はプロジェクト内 JSON のみ（DBなし）。ローカル単一ユーザー前提。
const DATA_DIR = path.join(process.cwd(), "data");
const file = (name: string) => path.join(DATA_DIR, name);

async function readJson<T>(name: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file(name), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(name: string, value: unknown): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file(name), JSON.stringify(value, null, 2) + "\n", "utf8");
}

// 照合対象 = seeds.json（固定の種）＋ log.json（運用中に追記されたミス）。
export async function loadCases(): Promise<Seed[]> {
  const seeds = await readJson<Seed[]>("seeds.json", []);
  const log = await readJson<Seed[]>("log.json", []);
  return [...seeds, ...log];
}

export async function appendLog(seed: Seed): Promise<void> {
  const log = await readJson<Seed[]>("log.json", []);
  log.push(seed);
  await writeJson("log.json", log);
}

// ── 判定キャッシュ（§6.4）: 正規化キー -> Warning[] ──────────────────────────
export async function getCached(key: string): Promise<Warning[] | null> {
  const cache = await readJson<Record<string, Warning[]>>("cache.json", {});
  return key in cache ? cache[key] : null;
}

export async function setCached(key: string, warnings: Warning[]): Promise<void> {
  const cache = await readJson<Record<string, Warning[]>>("cache.json", {});
  cache[key] = warnings;
  await writeJson("cache.json", cache);
}

// 照合対象（seeds+log）が増えたら、古い即答は嘘になる。まるごと捨てる。
export async function clearCache(): Promise<void> {
  await writeJson("cache.json", {});
}

// ── 誤検知の抑制（学習ループの片翼）: key -> 抑制する relatedCaseId[] ─────────
// 「誤検知」と言われた警告は、同じパターン(key)の同じ根拠(relatedCaseId)では
// 二度と出さない。カラス自身が「同じミスを繰り返さない」ための記憶。
export async function loadSuppress(key: string): Promise<string[]> {
  const s = await readJson<Record<string, string[]>>("suppress.json", {});
  return s[key] ?? [];
}

export async function addSuppress(
  key: string,
  relatedCaseId: string,
): Promise<void> {
  const s = await readJson<Record<string, string[]>>("suppress.json", {});
  const list = s[key] ?? [];
  if (!list.includes(relatedCaseId)) list.push(relatedCaseId);
  s[key] = list;
  await writeJson("suppress.json", s);
}

// キャッシュ/新規いずれの経路でも、返す直前に抑制済みを落とす。
export function filterSuppressed(
  warnings: Warning[],
  suppressed: string[],
): Warning[] {
  if (suppressed.length === 0) return warnings;
  return warnings.filter((w) => !suppressed.includes(w.relatedCaseId));
}

// ── 自己監視（§6.5）: 的中率 ─────────────────────────────────────────────────
export type HitRate = { helpful: number; falsePositive: number };

export async function loadHitRate(): Promise<HitRate> {
  return readJson<HitRate>("hitrate.json", { helpful: 0, falsePositive: 0 });
}

export async function recordFeedback(
  kind: "helpful" | "falsePositive",
): Promise<HitRate> {
  const h = await loadHitRate();
  h[kind] += 1;
  await writeJson("hitrate.json", h);
  return h;
}
