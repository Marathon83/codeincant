const TABS = [
  { id: "generate",   label: "Generate",     tip: "Describe what you need — get a complete, production-ready script" },
  { id: "debug",      label: "Debugger",     tip: "Paste broken code + error output and get a fixed version" },
  { id: "analyze",    label: "Analyzer",     tip: "Reverse-engineer any script — line-by-line breakdown, security risks, dependencies" },
  { id: "convert",    label: "Convert",      tip: "Translate scripts between bash, Python, JavaScript, Ruby, PowerShell, and more" },
  { id: "improve",    label: "Improve",      tip: "Simplify, add comments, make production-ready, or rewrite for beginners" },
  { id: "simulate",   label: "Simulate",     tip: "Dry-run a script — step-by-step breakdown and risk assessment before you execute" },
  { id: "cheatsheet", label: "Cheat Sheets", tip: "Build ready-to-run commands for common tools with guided parameter selection" },
  { id: "tutor",      label: "AI Tutor",     tip: "Learn from your own code — annotated explanations, key concepts, and exercises" },
  { id: "sandbox",    label: "Sandbox",      tip: "Execute code live in an isolated Docker container with no network access" },
  { id: "security",   label: "Security",     tip: "Static security scan — findings by severity, overall score, and passed checks" },
  { id: "workflow",   label: "Workflow",     tip: "Describe a multi-step task in plain English and get individual + combined scripts" },
];

export default function TabBar({ active, onChange }) {
  return (
    <div className="tab-bar">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={active === t.id ? "active" : ""}
          onClick={() => onChange(t.id)}
          data-tooltip={t.tip}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
