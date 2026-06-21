import { useState } from "react";

const isNative = () => !!window.Capacitor?.isNativePlatform?.();

export default function SettingsModal({ onClose, onKeyChange }) {
  const [section, setSection] = useState("api");

  // API Key
  const stored        = localStorage.getItem("scriptforge_api_key") || "";
  const [key, setKey] = useState(stored);
  const [keySaved, setKeySaved] = useState(false);
  const valid = key.trim().startsWith("sk-ant-");

  // Profile
  const storedFolder       = localStorage.getItem("scriptforge_save_folder") || "";
  const [folder, setFolder] = useState(storedFolder);
  const [folderSaved, setFolderSaved] = useState(false);

  const saveKey = () => {
    if (!valid) return;
    localStorage.setItem("scriptforge_api_key", key.trim());
    onKeyChange?.();
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 1500);
  };

  const removeKey = () => {
    localStorage.removeItem("scriptforge_api_key");
    setKey("");
    onKeyChange?.();
  };

  const saveFolder = () => {
    localStorage.setItem("scriptforge_save_folder", folder.trim());
    setFolderSaved(true);
    setTimeout(() => setFolderSaved(false), 1500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Settings</div>

        <div className="settings-tabs">
          <button className={section === "api" ? "active" : ""} onClick={() => setSection("api")}>
            API Key
          </button>
          <button className={section === "profile" ? "active" : ""} onClick={() => setSection("profile")}>
            Profile
          </button>
        </div>

        {section === "api" && (
          <>
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
                onKeyDown={(e) => e.key === "Enter" && saveKey()}
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
              <button className="btn btn-primary" onClick={saveKey} disabled={!valid}>
                {keySaved ? "✓ Saved" : "Save Key"}
              </button>
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
              {stored && (
                <button className="btn btn-danger btn-icon" onClick={removeKey} title="Remove saved key">
                  Remove
                </button>
              )}
            </div>
          </>
        )}

        {section === "profile" && (
          <>
            <p style={{ fontSize: 13, lineHeight: 1.75, marginBottom: 16, color: "var(--text)" }}>
              Configure your preferences. Settings are stored in your browser.
            </p>

            <div className="form-row">
              <label>Save Folder</label>
              <input
                type="text"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveFolder()}
                placeholder={isNative() ? "ScriptForge" : "/home/user/scripts"}
                spellCheck={false}
                style={{ fontFamily: "var(--font-mono)" }}
              />
              <span style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>
                {isNative()
                  ? "Scripts saved via ⬇ Save will be written to this folder inside your Documents directory."
                  : "On the web, ⬇ Save triggers a browser download. This folder path is used when running ScriptForge as a native app."}
              </span>
            </div>

            <div className="btn-group">
              <button className="btn btn-primary" onClick={saveFolder}>
                {folderSaved ? "✓ Saved" : "Save Profile"}
              </button>
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
