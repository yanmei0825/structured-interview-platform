const BASE = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/+$/, "");

function url(path: string) {
  return `${BASE}${path}`;
}

export type Language = "ru" | "en" | "tr";

export type DimensionKey =
  | "D1" | "D2" | "D3" | "D4" | "D5"
  | "D6" | "D7" | "D8" | "D9" | "D10";

export const DIMENSION_MAX_TURNS: Record<DimensionKey, number> = {
  D1: 3, D2: 3, D3: 3, D4: 3, D5: 3,
  D6: 3, D7: 3, D8: 3, D9: 4, D10: 3,
};

export interface SessionState {
  token: string;
  projectId: string;
  language: Language | null;
  demographicsEnabled: boolean;
  demographicsSubmitted: boolean;
  started: boolean;
  finished: boolean;
  currentDimension: DimensionKey | null;
  turnCount: number;
  coverage: Record<DimensionKey, { covered: boolean; turnCount: number }>;
}

export async function createSession(projectId: string): Promise<{ token: string }> {
  const res = await fetch(url("/survey/public-session"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId }),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error ?? "Failed to create session");
  }
  return res.json();
}

export async function setLanguage(
  token: string,
  language: Language
): Promise<{ intro?: string }> {
  const res = await fetch(url(`/survey/${token}/language`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language }),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error ?? "Failed to set language");
  }
  return res.json();
}

export async function submitDemographics(
  token: string,
  data: Record<string, string>
): Promise<{ intro?: string }> {
  const res = await fetch(url(`/survey/${token}/demographics`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error ?? "Failed to submit demographics");
  }
  return res.json();
}

export async function sendMessage(
  token: string,
  message: string
): Promise<{ reply: string; dimension: DimensionKey | null; finished: boolean }> {
  const res = await fetch(url(`/survey/${token}/message`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error ?? "Server error");
  }
  return res.json();
}

// ── Streaming send ────────────────────────────────────────────────────────────
export interface StreamResult {
  dimension: DimensionKey | null;
  finished: boolean;
}

export function sendMessageStream(
  token: string,
  message: string,
  onChunk: (chunk: string) => void
): Promise<StreamResult> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(url(`/survey/${token}/message/stream`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        return reject(new Error(d.error ?? "Server error"));
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let result: StreamResult = { dimension: null, finished: false };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.chunk) onChunk(data.chunk);
            if (data.done) {
              result = {
                dimension: data.dimension ?? null,
                finished: data.finished ?? false,
              };
            }
          } catch {}
        }
      }

      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
}

export async function getSession(token: string): Promise<SessionState> {
  const res = await fetch(url(`/survey/${token}`));
  if (!res.ok) throw new Error("Session not found");
  return res.json();
}
