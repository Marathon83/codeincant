import { useState } from "react";

export default function ApiKeyModal({ onClose, isRequired = false }) {
  const stored        = localStorage.getItem("scriptforge_api_key") || "";
  const [key, setKey] = useState(stored);
  const [saved, setSaved] = useState(false);

  const valid = key.trim().startsWith("sk-ant-");

  const save = () => {
    if (!valid) return;
    localStorage.setItem("scriptforge_api_key", key.trim());
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose?.(); }, 700);
  };

  const remove = () => {
    localStorage.removeItem("scriptforge_api_key");
    setKey("");
  };

  return (
    <div
      className="modal-overlay"
      onClick={isRequired ? undefined : onClose}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Anthropic API Key</div>

        <p style={{ fontSize: 13, lineHeight: 1.75, marginBottom: 16, color: "var(--text)" }}>
          ScriptForge uses your own Anthropic API key — stored only in your browser and sent with
          each request. It is never logged or stored on the server.
        </p>

        <div className="form-row">
          <label>API Key</label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="sk-ant-api03-…"
            autoFocus
            spellCheck={false}
            style={{ fontFamily: "var(--font-mono)" }}
          />
          {key && !valid && (
            <span style={{ fontSize: 11, color: "var(--amber)", marginTop: 4 }}>
              Key should start with sk-ant-
            </span>
          )}
        </div>

        <p style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 16 }}>
          Get your key at{" "}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--green-dim)" }}
          >
            console.anthropic.com → API Keys
          </a>
        </p>

        <div className="btn-group">
          <button className="btn btn-primary" onClick={save} disabled={!valid}>
            {saved ? "✓ Saved" : "Save Key"}
          </button>
          {!isRequired && onClose && (
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          )}
          {stored && (
            <button className="btn btn-danger btn-icon" onClick={remove} title="Remove saved key">
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
