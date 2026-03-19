import { spawnSync } from "node:child_process";
import { renameSync, writeFileSync } from "node:fs";

const requireBanner =
  "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("pnpm", ["exec", "react-router", "build"]);

run("pnpm", [
  "exec",
  "esbuild",
  "build/server/index.js",
  "--bundle",
  "--platform=node",
  "--target=node24",
  "--format=esm",
  `--banner:js=${requireBanner}`,
  "--outfile=build/server/index.lambda.js",
]);

renameSync("build/server/index.lambda.js", "build/server/index.js");

run("pnpm", [
  "exec",
  "esbuild",
  "app/lambda.ts",
  "--bundle",
  "--platform=node",
  "--target=node24",
  "--format=esm",
  "--external:./index.js",
  "--outfile=build/server/lambda.mjs",
]);

writeFileSync("build/server/package.json", '{"type":"module"}\n');
