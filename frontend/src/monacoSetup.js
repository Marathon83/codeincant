import { loader } from "@monaco-editor/react";
// Import only the editor core + the basic-language tokenizers CodeBlock's
// MONACO_LANG map actually uses, instead of the `monaco-editor` barrel
// (which registers all ~100 bundled languages and their language-service
// workers). Keeps the bundle to the handful of languages CodeIncant shows.
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import "monaco-editor/esm/vs/basic-languages/shell/shell.contribution";
import "monaco-editor/esm/vs/basic-languages/powershell/powershell.contribution";
import "monaco-editor/esm/vs/basic-languages/python/python.contribution";
import "monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution";
import "monaco-editor/esm/vs/basic-languages/ruby/ruby.contribution";
import "monaco-editor/esm/vs/basic-languages/go/go.contribution";
import "monaco-editor/esm/vs/basic-languages/rust/rust.contribution";
import "monaco-editor/esm/vs/basic-languages/sql/sql.contribution";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";

// None of the above are "rich" languages (json/css/html/typescript), so
// the plain editor worker covers all of them — no language-service workers needed.
self.MonacoEnvironment = {
  getWorker: () => new editorWorker(),
};

// Bundle Monaco locally instead of fetching it from jsdelivr's CDN at
// runtime — avoids failures behind restrictive proxies/firewalls and
// removes an external dependency from the core generate/debug/convert flow.
loader.config({ monaco });
