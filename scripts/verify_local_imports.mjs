import fs from "node:fs";
import path from "node:path";
let ts;
try {
  const typescript = await import("typescript");
  ts = typescript.default ?? typescript;
} catch {
  console.error("TypeScript is not installed. Run npm install first.");
  process.exit(2);
}

const root = process.cwd();
const roots = ["app", "components", "lib", "types"];
const sourceExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".css", ".json"];
const failures = [];
const sources = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(?:ts|tsx|js|jsx|mjs)$/.test(entry.name)) sources.push(file);
  }
}

for (const directory of roots) walk(path.join(root, directory));

function resolveLocal(specifier, importer) {
  const base = specifier.startsWith("@/")
    ? path.join(root, specifier.slice(2))
    : path.resolve(path.dirname(importer), specifier);

  const candidates = [base];
  for (const extension of sourceExtensions) candidates.push(base + extension);
  candidates.push(...sourceExtensions.map((extension) => path.join(base, `index${extension}`)));

  return candidates.find((candidate) => fs.existsSync(candidate));
}

for (const file of sources) {
  const text = fs.readFileSync(file, "utf8");
  const kind = file.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : file.endsWith(".jsx")
      ? ts.ScriptKind.JSX
      : file.endsWith(".mjs")
        ? ts.ScriptKind.JS
        : ts.ScriptKind.TS;
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);

  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const specifier = statement.moduleSpecifier;
    if (!ts.isStringLiteral(specifier)) continue;
    const value = specifier.text;
    if (!(value.startsWith("@/") || value.startsWith("./") || value.startsWith("../"))) continue;
    if (!resolveLocal(value, file)) {
      failures.push(`${path.relative(root, file)} imports missing local module ${value}`);
    }
  }
}

if (failures.length) {
  console.error(`LOCAL IMPORT GATE: FAIL (${failures.length} issue${failures.length === 1 ? "" : "s"})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`LOCAL IMPORT GATE: PASS (${sources.length} source files checked)`);
