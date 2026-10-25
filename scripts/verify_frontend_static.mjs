import fs from "node:fs";
import path from "node:path";
let ts;
try {
  const typescript = await import("typescript");
  ts = typescript.default ?? typescript;
} catch {
  console.error("TypeScript is not installed. Run `npm install` before running the frontend static gate.");
  process.exit(2);
}

const root = process.cwd();
const sourceRoots = ["app", "components", "lib", "types"];
const sourceFiles = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry.name)) sourceFiles.push(fullPath);
  }
}

for (const directory of sourceRoots) walk(path.join(root, directory));

const failures = [];
const bannedPatterns = [
  { pattern: /@ts-(?:ignore|expect-error)/, message: "TypeScript suppression directive is not allowed" },
  {
    pattern: /\bconsole\.(?:log|debug|info|warn|error)\s*\(/,
    message: "Console logging is not allowed in app source",
  },
  {
    pattern: /JSON\.stringify\(filters\)/,
    message: "Do not use JSON.stringify(filters) as a React effect dependency",
  },
  {
    pattern: /valueFormatter\s*:\s*\(\s*value\s*:\s*number\s*\)/,
    message: "ECharts tooltip valueFormatter must accept the library's broader value type",
  },
];

for (const file of sourceFiles) {
  const sourceText = fs.readFileSync(file, "utf8");
  const relative = path.relative(root, file);
  const scriptKind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, scriptKind);

  for (const diagnostic of sourceFile.parseDiagnostics ?? []) {
    const position = sourceFile.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
    failures.push(
      `${relative}:${position.line + 1}:${position.character + 1} ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`,
    );
  }

  function visit(node) {
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      failures.push(`${relative}:${position.line + 1} explicit any type is not allowed`);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  // Catch a common accessibility regression before Biome: an aria-label on a
  // plain <div> without a role. Labels are valid on semantic/explicitly-role
  // elements, but not on a generic div.
  function checkGenericAriaLabels(node) {
    if (ts.isJsxOpeningElement(node)) {
      const tagName = node.tagName.getText(sourceFile);
      const genericTags = new Set(["div", "span"]);
      if (genericTags.has(tagName)) {
        const hasAriaLabel = node.attributes.properties.some(
          (attribute) => ts.isJsxAttribute(attribute) && attribute.name.text === "aria-label",
        );
        const hasRole = node.attributes.properties.some(
          (attribute) => ts.isJsxAttribute(attribute) && attribute.name.text === "role",
        );
        if (hasAriaLabel && !hasRole) {
          const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
          failures.push(
            `${relative}:${position.line + 1}:${position.character + 1} <${tagName}> uses aria-label without an explicit role`,
          );
        }
      }
    }
    ts.forEachChild(node, checkGenericAriaLabels);
  }
  checkGenericAriaLabels(sourceFile);

  // React's current lint guidance discourages synchronous state writes directly
  // inside effects. Catch the common setter pattern statically while allowing
  // setters inside nested callbacks such as timers/promises.
  function checkEffectSetterCalls(node) {
    if (!ts.isCallExpression(node)) return false;
    const callee = node.expression;
    const isEffect =
      ts.isIdentifier(callee) && (callee.text === "useEffect" || callee.text === "useLayoutEffect");
    if (!isEffect || node.arguments.length === 0) return false;

    const callback = node.arguments[0];
    if (!ts.isArrowFunction(callback) && !ts.isFunctionExpression(callback)) return false;

    function walkEffectBody(current, functionDepth) {
      if (
        ts.isArrowFunction(current) ||
        ts.isFunctionExpression(current) ||
        ts.isFunctionDeclaration(current)
      ) {
        if (current !== callback) return;
      }
      if (functionDepth === 0 && ts.isCallExpression(current) && ts.isIdentifier(current.expression)) {
        if (/^set[A-Z]/.test(current.expression.text)) {
          const position = sourceFile.getLineAndCharacterOfPosition(current.getStart(sourceFile));
          failures.push(
            `${relative}:${position.line + 1}:${position.character + 1} state setter ${current.expression.text} is called directly inside an effect; move it into a callback or derive the state instead`,
          );
        }
      }
      ts.forEachChild(current, (child) => {
        const nextDepth =
          child !== callback &&
          (ts.isArrowFunction(child) || ts.isFunctionExpression(child) || ts.isFunctionDeclaration(child))
            ? functionDepth + 1
            : functionDepth;
        walkEffectBody(child, nextDepth);
      });
    }

    walkEffectBody(callback.body, 0);
    return true;
  }

  function visitEffects(node) {
    checkEffectSetterCalls(node);
    ts.forEachChild(node, visitEffects);
  }
  visitEffects(sourceFile);

  // Catch React keys derived from a map index, including template literals such as
  // key={`row-${index}`}. Constant keys and stable row identifiers are fine.
  function checkIndexKeys(node) {
    if (ts.isJsxAttribute(node) && node.name.text === "key" && node.initializer) {
      const keyExpression = node.initializer.getText(sourceFile);
      if (/\bindex\b/.test(keyExpression)) {
        const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        failures.push(
          `${relative}:${position.line + 1}:${position.character + 1} React key uses array index; use a stable data-derived key instead`,
        );
      }
    }
    ts.forEachChild(node, checkIndexKeys);
  }
  checkIndexKeys(sourceFile);

  // Lightweight import hygiene runs before package-aware TypeScript checks.
  const importedNames = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.importClause) continue;
    const clause = statement.importClause;
    if (clause.name) importedNames.push(clause.name.text);
    if (clause.namedBindings) {
      if (ts.isNamespaceImport(clause.namedBindings)) {
        importedNames.push(clause.namedBindings.name.text);
      } else {
        importedNames.push(...clause.namedBindings.elements.map((element) => element.name.text));
      }
    }
  }

  const identifierCounts = new Map();
  function countIdentifiers(node) {
    if (ts.isIdentifier(node)) {
      identifierCounts.set(node.text, (identifierCounts.get(node.text) ?? 0) + 1);
    }
    ts.forEachChild(node, countIdentifiers);
  }
  countIdentifiers(sourceFile);

  for (const name of new Set(importedNames)) {
    if ((identifierCounts.get(name) ?? 0) <= 1) {
      failures.push(`${relative} unused import: ${name}`);
    }
  }

  for (const { pattern, message } of bannedPatterns) {
    if (pattern.test(sourceText)) failures.push(`${relative} ${message}`);
  }
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const expected = {
  node: ">=24.21.0 <25",
  npm: ">=11.19.0 <12",
  next: "16.3.8",
  react: "19.3.0",
  reactTypes: "19.3.0",
  reactDomTypes: "19.3.0",
  typescript: "6.0.3",
  biome: "2.5.15",
  echarts: "6.1.0",
  table: "9.2.4",
};

if (packageJson.engines?.node !== expected.node)
  failures.push("package.json Node engine is not the approved project baseline");
if (packageJson.engines?.npm !== expected.npm)
  failures.push("package.json npm engine is not the approved project baseline");
if (packageJson.packageManager !== "npm@11.19.0")
  failures.push("package.json packageManager is not npm@11.19.0");
if (packageJson.dependencies?.next !== expected.next)
  failures.push("package.json Next.js version drifted from the approved baseline");
if (packageJson.dependencies?.react !== expected.react)
  failures.push("package.json React version drifted from the approved baseline");
if (packageJson.devDependencies?.typescript !== expected.typescript)
  failures.push("package.json TypeScript version drifted from the approved baseline");
if (packageJson.devDependencies?.["@types/react"] !== expected.reactTypes)
  failures.push("package.json @types/react version drifted from the approved baseline");
if (packageJson.devDependencies?.["@types/react-dom"] !== expected.reactDomTypes)
  failures.push("package.json @types/react-dom version drifted from the approved baseline");
if (packageJson.devDependencies?.["@biomejs/biome"] !== expected.biome)
  failures.push("package.json Biome version drifted from the approved baseline");
if (packageJson.dependencies?.echarts !== expected.echarts)
  failures.push("package.json ECharts version drifted from the approved baseline");
if (packageJson.dependencies?.["@tanstack/react-table"] !== expected.table)
  failures.push("package.json TanStack Table version drifted from the approved baseline");
if (packageJson.dependencies?.eslint || packageJson.devDependencies?.eslint)
  failures.push("ESLint dependency remains; use Biome for this project");

for (const stale of ["eslint.config.mjs", "scripts/verify_frontend_syntax.cjs"]) {
  if (fs.existsSync(path.join(root, stale)))
    failures.push(`${stale} should not exist in the final toolchain`);
}

const requiredFiles = [
  "app/command-center/page.tsx",
  "app/data-preparation/page.tsx",
  "app/explore/page.tsx",
  "app/statistics/page.tsx",
  "app/anomalies/page.tsx",
  "backend/app/analytics/preprocessing.py",
  "backend/app/analytics/descriptive.py",
  "backend/app/analytics/inferential.py",
  "backend/app/analytics/regression.py",
  "backend/app/analytics/anomaly.py",
  "backend/app/analytics/forecasting.py",
  "backend/app/api/routes.py",
];

for (const required of requiredFiles) {
  if (!fs.existsSync(path.join(root, required)))
    failures.push(`Required project file is missing: ${required}`);
}

console.log(`Parsed ${sourceFiles.length} TypeScript/TSX source files`);
if (failures.length) {
  console.error(`\nFRONTEND STATIC GATE: FAIL (${failures.length} issue${failures.length === 1 ? "" : "s"})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("FRONTEND STATIC GATE: PASS");
console.log("- TypeScript/TSX syntax: PASS");
console.log("- explicit any: PASS");
console.log("- unused imports: PASS");
console.log("- suppression directives: PASS");
console.log("- stale ESLint configuration: PASS");
console.log("- approved dependency baseline: PASS");
