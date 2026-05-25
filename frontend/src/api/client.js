import axios from "axios";

// On native (iOS/Android) the device can't reach 127.0.0.1 on the host.
// Set VITE_API_URL in .env.production (or .env.local) to your server's IP/URL.
// e.g. VITE_API_URL=http://192.168.1.42:8000
const BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
const api = axios.create({ baseURL: BASE });

export const generateScript  = (data) => api.post("/generate", data).then(r => r.data);
export const simulateScript  = (data) => api.post("/simulate", data).then(r => r.data);
export const debugScript     = (data) => api.post("/debug", data).then(r => r.data);
export const analyzeScript   = (data) => api.post("/analyze", data).then(r => r.data);
export const convertScript   = (data) => api.post("/convert", data).then(r => r.data);
export const improveScript   = (data) => api.post("/improve", data).then(r => r.data);
export const buildCheatsheet = (data) => api.post("/cheatsheet", data).then(r => r.data);
export const tutorCode       = (data) => api.post("/tutor", data).then(r => r.data);
export const runSandbox      = (data) => api.post("/sandbox", data).then(r => r.data);

// Async generator for SSE streaming endpoints.
// Yields { text } chunks while streaming, then { done: true, result } when complete.
export async function* streamRequest(endpoint, data, signal) {
  const response = await fetch(`${BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    signal,
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop();
    for (const part of parts) {
      if (part.startsWith("data: ")) {
        try { yield JSON.parse(part.slice(6)); } catch { /* skip malformed */ }
      }
    }
  }
}
