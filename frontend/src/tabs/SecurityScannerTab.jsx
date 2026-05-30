import { useState, useRef, useEffect, useCallback } from "react";
import { streamRequest } from "../api/client";
import { useTabCtx } from "../context/TabContext";
import OsProfileSelector from "../components/OsProfileSelector";
import CodeBlock from "../components/CodeBlock";
import SecurityBadge from "../components/SecurityBadge";
import SendTo from "../components/SendTo";
import useVoice from "../hooks/useVoice";

const LANGS = ["bash", "python", "javascript", "powershell", "ruby", "go", "sql", "shell"];

const SEV = {
  critical: { color: "#ff4444", bg: "rgba(255,68,68,0.12)", label: "✕ critical" },
  high:     { color: "#ff8800", bg: "rgba(255,136,0,0.12)",  label: "⚠ high" },
  medium:   { color: "#ffcc00", bg: "rgba(255,204,0,0.12)",  label: "~ medium" },
  low:      { color: "#44aaff", bg: "rgba(68,170,255,0.12)", label: "• low" },
  info:     { color: "#888888", bg: "rgba(136,136,136,0.10)", label: "i info" },
};
const SEV_ORDER = ["critical", "high", "medium", "low", "info"];

export default function SecurityScannerTab({ isActive = false }) {
  const [code, setCode]             = useState("");
  const [language, setLanguage]     = useState("bash");
  const [osProfile, setOsProfile]   = useState("linux");
  const [result, setResult]         = useState(null);
  const [streamText, setStreamText] = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const abortRef = useRef(null);
  const runRef   = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const onVoiceResult = useCallback((text) => setCode(p => p ? `${p} ${text}` : text), []);
  const { recording, supported: voiceOk, toggle: toggleVoice, voiceError } = useVoice(onVoiceResult);

  const { inbox, consume } = useTabCtx();
  const incoming = inbox["security"];
  useEffect(() => {
    if (!incoming) return;
    if (incoming.code)     setCode(incoming.code);
    if (incoming.language) setLanguage(incoming.language);
    consume("security");
  }, [incoming]);

  const scan = async () => {
    if (!code.trim() || loading) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError("");
    setResult(null);
    setStreamText("");
    try {
      for await (const chunk of streamRequest("/security/stream",
        { code, language, os_profile: osProfile },
        abortRef.current.signal
      )) {
        if (chunk.error) { setError(chunk.error); break; }
        if (chunk.done)  { setResult(chunk.result); setStreamText(""); }
        else             { setStreamText(prev => prev + chunk.text); }
      }
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message || "Backend error — is the server running?");
    }
    setLoading(false);
  };

  runRef.current = scan;
  useEffect(() => {
    if (!isActive) return;
    const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runRef.current(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isActive]);

  const sorted = result?.findings
    ? [...result.findings].sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity))
    : [];

  return (
    <div>
      <div className="panel">
        <div className="panel-title">Security Scanner</div>

        <OsProfileSelector value={osProfile} onChange={setOsProfile} />

        <div className="form-row">
          <label>Language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ width: "auto" }}>
            {LANGS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>

        <div className="form-row">
          <label>Paste script to scan</label>
          <CodeBlock code={code} language={language} readOnly={false} onChange={setCode} height={240} />
        </div>

        <div className="btn-group">
          <button className="btn btn-primary" onClick={scan} disabled={loading || !code.trim()}>
            {loading
              ? <><span className="spinner" /> Scanning…</>
              : <>🔒 Scan <span style={{ color: "var(--green-dim)", fontSize: 10, marginLeft: 6 }}>Ctrl+↵</span></>}
          </button>
          {voiceOk && (
            <button className={`btn btn-voice${recording ? " recording" : ""}`} onClick={toggleVoice}>
              {recording ? "⏹ Stop" : "🎤 Voice"}
            </button>
          )}
          {loading && (
            <button className="btn btn-danger btn-icon" onClick={() => abortRef.current?.abort()}>✕ Cancel</button>
          )}
        </div>

        {voiceError && <div className="error-msg mt-12">{voiceError}</div>}
        {error && (
          <div className="error-msg mt-12" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span>{error}</span>
            <button className="btn btn-secondary btn-icon" style={{ flexShrink: 0 }} onClick={() => runRef.current?.()}>↺ Retry</button>
          </div>
        )}
      </div>

      {streamText && (
        <div className="panel stream-panel">
          <span className="spinner" style={{ flexShrink: 0 }} />
          <span className="panel-title" style={{ marginBottom: 0 }}>Scanning…</span>
          <span style={{ color: "var(--text-dim)", fontSize: 11, marginLeft: "auto" }}>{streamText.length.toLocaleString()} chars</span>
        </div>
      )}

      {result && (
        <>
          <div className="panel">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
              <SecurityBadge level={result.risk_level} />
              <span style={{ fontSize: 13, color: "var(--text-dim)" }}>
                Score: <strong style={{ color: "var(--text)" }}>{result.score}/10</strong>
              </span>
              <span style={{ fontSize: 13, lineHeight: 1.6, flex: 1 }}>{result.summary}</span>
            </div>
            <SendTo code={code} language={language} />
          </div>

          {sorted.length > 0 && (
            <div className="panel">
              <div className="panel-title">Findings ({sorted.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {sorted.map((f, i) => {
                  const s = SEV[f.severity] || SEV.info;
                  return (
                    <div key={i} style={{ background: s.bg, border: `1px solid ${s.color}44`, borderRadius: 6, padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ color: s.color, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</span>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{f.title}</span>
                      </div>
                      {f.line_hint && (
                        <div style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-dim)", marginBottom: 4 }}>{f.line_hint}</div>
                      )}
                      <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: f.remediation ? 6 : 0 }}>{f.description}</div>
                      {f.remediation && (
                        <div style={{ fontSize: 12, color: "var(--green)", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 6 }}>
                          ✓ Fix: {f.remediation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {result.passed?.length > 0 && (
            <div className="panel">
              <div className="panel-title">Passed Checks</div>
              <ul className="result-list">
                {result.passed.map((p, i) => <li key={i} style={{ color: "var(--green)" }}>✓ {p}</li>)}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
