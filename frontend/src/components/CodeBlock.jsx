import { useState } from "react";
import Editor from "@monaco-editor/react";

const PASTE_RUNNERS = {
  bash: "bash", shell: "bash", zsh: "zsh", sh: "bash",
  python: "python3", javascript: "node", ruby: "ruby",
};

const MONACO_LANG = {
  bash: "shell", shell: "shell", powershell: "powershell",
  python: "python", javascript: "javascript", ruby: "ruby",
  go: "go", rust: "rust", sql: "sql",
};

function unescape(src) {
  if (src.includes("\\n") && !src.includes("\n")) {
    return src
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
  return src;
}

const MONACO_EDIT_OPTIONS = {
  readOnly: false,
  minimap: { enabled: false },
  fontSize: 13,
  lineNumbers: "on",
  scrollBeyondLastLine: false,
  wordWrap: "on",
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  automaticLayout: true,
  tabSize: 2,
  scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
};

const MONACO_READ_OPTIONS = {
  readOnly: true,
  minimap: { enabled: false },
  fontSize: 13,
  lineNumbers: "on",
  scrollBeyondLastLine: false,
  wordWrap: "on",
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
};

export default function CodeBlock({ code, language = "shell", readOnly = true, onChange, height = 320 }) {
  const [copied, setCopied]           = useState(false);
  const [pastecopied, setPasteCopied] = useState(false);
  const [pasted, setPasted]           = useState(false);

  const pasteRunner = PASTE_RUNNERS[language] || null;

  const writeClipboard = (text) => {
    const cap = window.Capacitor;
    if (cap?.isNativePlatform?.()) {
      return cap.Plugins.Clipboard.write({ string: text });
    }
    return navigator.clipboard.writeText(text);
  };

  const readClipboard = () => {
    const cap = window.Capacitor;
    if (cap?.isNativePlatform?.()) {
      return cap.Plugins.Clipboard.read().then((r) => r.value ?? "");
    }
    return navigator.clipboard.readText();
  };

  const paste = () => {
    readClipboard().then((text) => {
      onChange && onChange(text);
      setPasted(true);
      setTimeout(() => setPasted(false), 1500);
    }).catch(() => {});
  };

  const copy = () => {
    writeClipboard(code || "").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  const copyForPaste = () => {
    const src  = unescape(code || "");
    const safe = `${pasteRunner} << 'SFEOF'\n${src}\nSFEOF`;
    writeClipboard(safe).then(() => {
      setPasteCopied(true);
      setTimeout(() => setPasteCopied(false), 1500);
    }).catch(() => {});
  };

  const download = async () => {
    const ext      = { bash: "sh", shell: "sh", powershell: "ps1", python: "py", javascript: "js" }[language] || "txt";
    const filename = `script.${ext}`;
    const content  = unescape(code || "");
    const cap      = window.Capacitor;

    if (cap?.isNativePlatform?.()) {
      const saveFolder = localStorage.getItem("scriptforge_save_folder")?.trim() || "ScriptForge";
      try {
        await cap.Plugins.Filesystem.writeFile({
          path: `${saveFolder}/${filename}`,
          data: content,
          directory: "DOCUMENTS",
          encoding: "utf8",
          recursive: true,
        });
        return;
      } catch (err) {
        console.error("Filesystem write failed:", err);
      }
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const toolbar = (
    <div className="code-block-toolbar">
      <span className="code-block-lang">{language}</span>
      <div className="code-block-actions">
        {!readOnly && (
          <button className="btn btn-secondary btn-icon" onClick={paste}>
            {pasted ? "✓ Pasted" : "⬆ Paste"}
          </button>
        )}
        <button className="btn btn-secondary btn-icon" onClick={copy}>{copied ? "✓ Copied" : "Copy"}</button>
        {pasteRunner && (
          <button
            className="btn btn-secondary btn-icon"
            onClick={copyForPaste}
            title={`${pasteRunner} << 'SFEOF' — safe to paste into zsh`}
          >
            {pastecopied ? "✓ Ready" : "Copy (paste-safe)"}
          </button>
        )}
        <button className="btn btn-secondary btn-icon" onClick={download}>⬇ Save</button>
      </div>
    </div>
  );

  return (
    <div className="code-block-wrap">
      {toolbar}
      <Editor
        height={height}
        language={MONACO_LANG[language] || "shell"}
        value={readOnly ? unescape(code || "") : (code || "")}
        onChange={readOnly ? undefined : (val) => onChange && onChange(val ?? "")}
        theme="vs-dark"
        options={readOnly ? MONACO_READ_OPTIONS : MONACO_EDIT_OPTIONS}
      />
    </div>
  );
}
