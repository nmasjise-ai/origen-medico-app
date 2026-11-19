import { readdir } from "node:fs/promises";
import path from "node:path";

const API_ROOT = path.resolve("api");
const HOBBY_FUNCTION_LIMIT = 12;
const FUNCTION_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".ts", ".mts", ".cts"]);

async function collectFunctions(directory, relative = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const found = [];

  for (const entry of entries) {
    if (entry.name.startsWith("_")) continue;

    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.posix.join(relative, entry.name);

    if (entry.isDirectory()) {
      found.push(...await collectFunctions(absolutePath, relativePath));
    } else if (entry.isFile() && FUNCTION_EXTENSIONS.has(path.extname(entry.name))) {
      found.push(relativePath);
    }
  }

  return found;
}

const functions = (await collectFunctions(API_ROOT)).sort();

console.log(`Vercel Serverless Functions: ${functions.length}/${HOBBY_FUNCTION_LIMIT}`);
for (const file of functions) console.log(` - api/${file}`);

if (functions.length > HOBBY_FUNCTION_LIMIT) {
  console.error(
    `ERROR: Vercel Hobby allows at most ${HOBBY_FUNCTION_LIMIT} functions per deployment. Consolidate or redesign endpoints before adding another function.`
  );
  process.exitCode = 1;
} else if (functions.length === HOBBY_FUNCTION_LIMIT) {
  console.warn("WARNING: Function limit reached. Do not add another API route without consolidating existing routes.");
} else {
  console.log("Function count is within the Vercel Hobby limit.");
}
