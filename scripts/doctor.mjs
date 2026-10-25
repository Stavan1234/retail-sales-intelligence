import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REQUIRED_NODE = { major: 24, minor: 21 };
const REQUIRED_NPM = { major: 11, minor: 19 };

function parseVersion(value) {
  const match = String(value)
    .trim()
    .match(/v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

function readCommand(command, args) {
  try {
    return execFileSync(command, args, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true,
    }).trim();
  } catch {
    return null;
  }
}

function readInstalledPackageVersion(packageName) {
  const packagePath = path.join(ROOT, "node_modules", ...packageName.split("/"), "package.json");
  try {
    const manifest = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    return typeof manifest.version === "string" ? manifest.version : null;
  } catch {
    return null;
  }
}

function readNpmVersion() {
  const userAgentMatch = process.env.npm_config_user_agent?.match(/(?:^|\s)npm\/(\d+\.\d+\.\d+)/);
  if (userAgentMatch) return userAgentMatch[1];

  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath) {
    const viaNode = readCommand(process.execPath, [npmExecPath, "--version"]);
    if (viaNode) return viaNode;
  }

  const candidates =
    process.platform === "win32"
      ? [
          process.env.npm_node_execpath && path.join(path.dirname(process.env.npm_node_execpath), "npm.cmd"),
          path.join(path.dirname(process.execPath), "npm.cmd"),
          "npm.cmd",
        ].filter(Boolean)
      : ["npm"];

  for (const candidate of candidates) {
    const version = readCommand(candidate, ["--version"]);
    if (version) return version;
  }

  return null;
}

const nodeVersion = parseVersion(process.version);
const npmVersion = parseVersion(readNpmVersion());
const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const biomeConfigPath = path.join(ROOT, "biome.json");
const biomeConfig = fs.existsSync(biomeConfigPath)
  ? JSON.parse(fs.readFileSync(biomeConfigPath, "utf8"))
  : null;
const failures = [];
const expectedDependencies = {
  next: "16.3.8",
  react: "19.3.0",
  "react-dom": "19.3.0",
  "@tanstack/react-table": "9.2.4",
  echarts: "6.1.0",
  "lucide-react": "1.52.0",
  motion: "14.0.0",
};
const expectedDevDependencies = {
  "@biomejs/biome": "2.5.15",
  "@tailwindcss/postcss": "4.3.3",
  "@types/node": "24.10.1",
  "@types/react": "19.3.0",
  "@types/react-dom": "19.3.0",
  tailwindcss: "4.3.3",
  typescript: "6.0.3",
};

if (!nodeVersion || nodeVersion.major !== REQUIRED_NODE.major || nodeVersion.minor < REQUIRED_NODE.minor) {
  failures.push(
    `Node ${process.version} is outside the project baseline; use the approved Node 24.21.x project runtime.`,
  );
}

if (!npmVersion || npmVersion.major !== REQUIRED_NPM.major || npmVersion.minor < REQUIRED_NPM.minor) {
  failures.push(
    `npm ${npmVersion ? `${npmVersion.major}.${npmVersion.minor}.${npmVersion.patch}` : "not found"} is outside the project baseline; use npm 11.19.x.`,
  );
}

if (packageJson.engines?.node !== ">=24.21.0 <25") failures.push("package.json Node engine drifted.");
if (packageJson.engines?.npm !== ">=11.19.0 <12") failures.push("package.json npm engine drifted.");
if (packageJson.packageManager !== "npm@11.19.0") failures.push("package.json packageManager drifted.");
for (const [name, version] of Object.entries(expectedDependencies)) {
  if (packageJson.dependencies?.[name] !== version) {
    failures.push(`package.json dependency drifted: ${name} should be ${version}.`);
  }
}
for (const [name, version] of Object.entries(expectedDevDependencies)) {
  if (packageJson.devDependencies?.[name] !== version) {
    failures.push(`package.json devDependency drifted: ${name} should be ${version}.`);
  }
}
if (packageJson.dependencies?.eslint || packageJson.devDependencies?.eslint) {
  failures.push("ESLint is present; this project uses Biome.");
}
if (!biomeConfig?.files?.includes) failures.push("biome.json must define files.includes.");
if (biomeConfig?.files?.ignore)
  failures.push("biome.json uses the removed files.ignore key; use files.includes.");
if (biomeConfig?.linter?.rules?.recommended !== undefined) {
  failures.push("biome.json uses deprecated linter.rules.recommended; use linter.rules.preset.");
}
if (biomeConfig?.linter?.rules?.preset !== "recommended") {
  failures.push('biome.json must use linter.rules.preset="recommended".');
}

const nodeModulesPresent = fs.existsSync(path.join(ROOT, "node_modules"));
const lockfilePresent = fs.existsSync(path.join(ROOT, "package-lock.json"));
if (nodeModulesPresent) {
  for (const [name, expected] of Object.entries({ ...expectedDependencies, ...expectedDevDependencies })) {
    const installed = readInstalledPackageVersion(name);
    if (installed !== expected) {
      failures.push(`installed package drifted: ${name} is ${installed ?? "missing"}; expected ${expected}.`);
    }
  }
}
if (nodeModulesPresent && !lockfilePresent) {
  failures.push(
    "node_modules exists but package-lock.json is missing; regenerate the lockfile under the approved Node/npm baseline.",
  );
}

const requiredFiles = [
  "package.json",
  "tsconfig.json",
  "app/layout.tsx",
  "backend/app/main.py",
  "backend/requirements-lock.txt",
  "scripts/verify_truth.py",
  "scripts/verify_python_environment.py",
  "biome.json",
  "components.json",
  "data/source/sample_-_superstore.xlsx",
  "data/processed/superstore_processed.csv",
];
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(ROOT, file))) failures.push(`Required file is missing: ${file}`);
}

console.log(`Node: ${process.version}`);
console.log(
  `npm: ${npmVersion ? `${npmVersion.major}.${npmVersion.minor}.${npmVersion.patch}` : "unavailable"}`,
);
console.log(`Project: ${packageJson.name}@${packageJson.version}`);
console.log(
  `Install state: ${nodeModulesPresent ? "node_modules present" : "node_modules not installed yet"}`,
);
console.log(`Lockfile: ${lockfilePresent ? "present" : "not generated yet"}`);

if (failures.length) {
  console.error(`\nREPOSITORY DOCTOR: FAIL (${failures.length} issue${failures.length === 1 ? "" : "s"})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("\nREPOSITORY DOCTOR: PASS");
