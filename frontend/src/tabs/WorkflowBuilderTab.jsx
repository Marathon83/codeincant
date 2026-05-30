import { useState, useRef, useEffect, useCallback } from "react";
import { streamRequest } from "../api/client";
import OsProfileSelector from "../components/OsProfileSelector";
import CodeBlock from "../components/CodeBlock";
import SendTo from "../components/SendTo";
import useVoice from "../hooks/useVoice";

export default function WorkflowBuilderTab({ isActive = false }) {
  const [description, setDescription] = useState("");
  const [osProfile, setOsProfile]     = useState("linux");
  const [stepCount, setStepCount]     = useState(0);
  const [result, setResult]           = useState(null);
  const [streamText, setStreamText]   = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  const abortRef = useRef(null);
  const runRef   = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const onVoiceResult = useCallback((text) => setDescription(p => p ? `${p} ${text}` : text), []);
  const { recording, supported: voiceOk, toggle: toggleVoice, voiceError } = useVoice(onVoiceResult);

  const build = async () => {
    if (!description.trim() || loading) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError("");
    setResult(null);
    setStreamText("");
    try {
      for await (const chunk of streamRequest("/workflow/stream",
        { description, os_profile: osProfile, step_count: stepCount },
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

  runRef.current = build;
  useEffect(() => {
    if (!isActive) return;
    const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runRef.current(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isActive]);

  return (
    <div>
      <div className="panel">
        <div className="panel-title">Workflow Builder</div>

        <OsProfileSelector value={osProfile} onChange={setOsProfile} />

        <div className="form-row">
          <label>Describe your workflow</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Check disk usage, compress logs older than 7 days, upload to S3, then send a Slack notification"
            rows={4}
            style={{ width: "100%", resize: "vertical" }}
          />
        </div>

        <div className="form-row">
          <label>Steps <span style={{ color: "var(--text-dim)", fontSize: 11 }}>(0 = auto)</span></label>
          <input
            type="number"
            min={0}
            max={10}
            value={stepCount}
            onChange={(e) => setStepCount(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
            style={{ width: 80 }}
          />
        </div>

        <div className="btn-group">
          <button className="btn btn-primary" onClick={build} disabled={loading || !description.trim()}>
            {loading
              ? <><span className="spinner" /> Building…</>
              : <>⚙ Build Workflow <span style={{ color: "var(--green-dim)", fontSize: 10, marginLeft: 6 }}>Ctrl+↵</span></>}
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
          <span className="panel-title" style={{ marginBottom: 0 }}>Building workflow…</span>
          <span style={{ color: "var(--text-dim)", fontSize: 11, marginLeft: "auto" }}>{streamText.length.toLocaleString()} chars</span>
        </div>
      )}

      {result && (
        <>
          <div className="panel">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: result.summary ? 6 : 0 }}>{result.title}</div>
            {result.summary && <p style={{ color: "var(--text-dim)", fontSize: 13, margin: 0 }}>{result.summary}</p>}
          </div>

          {result.steps?.map((step, i) => (
            <div key={i} className="panel">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{
                  background: "var(--accent)", color: "#000", borderRadius: "50%",
                  width: 22, height: 22, display: "inline-flex", alignItems: "center",
                  justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>{i + 1}</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{step.title}</span>
              </div>
              {step.description && (
                <p style={{ color: "var(--text-dim)", fontSize: 12, margin: "0 0 8px" }}>{step.description}</p>
              )}
              <CodeBlock code={step.script} language={step.language || result.language} readOnly height={120} />
              <SendTo code={step.script} language={step.language || result.language} />
            </div>
          ))}

          {result.combined_script && (
            <div className="panel">
              <div className="panel-title">Combined Script</div>
              <CodeBlock code={result.combined_script} language={result.language} readOnly height={300} />
              <SendTo code={result.combined_script} language={result.language} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
