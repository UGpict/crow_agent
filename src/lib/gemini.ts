import { GoogleGenAI } from "@google/genai";

// ── Gemini access is funneled through this ONE file ──────────────────────────
// Callers depend on generateJson(), never on the SDK directly. To move from the
// Gemini Developer API (API key) to Vertex AI (ADC) later, change only
// getClient() — swap `{ apiKey }` for `{ vertexai: true, project, location }`.

const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

let cached: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (cached) return cached;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required — set it in .env.local.");
  }
  cached = new GoogleGenAI({ apiKey });
  return cached;
}

export type GenerateJsonInput = {
  systemInstruction: string;
  userText: string;
  responseSchema?: unknown;
  model?: string;
  temperature?: number;
};

// Every agent step returns JSON only; we parse defensively (§6).
export async function generateJson<T>(input: GenerateJsonInput): Promise<T> {
  const ai = getClient();
  const model = input.model ?? DEFAULT_MODEL;
  const res = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: input.userText }] }],
    config: {
      systemInstruction: input.systemInstruction,
      temperature: input.temperature ?? 0.2,
      responseMimeType: "application/json",
      ...(input.responseSchema
        ? { responseSchema: input.responseSchema as never }
        : {}),
    },
  });
  return safeParseJson<T>(res.text ?? "");
}

// Models occasionally wrap JSON in ```json fences despite responseMimeType.
function safeParseJson<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(
      `Gemini did not return valid JSON. First 200 chars: ${text.slice(0, 200)}`,
    );
  }
}
