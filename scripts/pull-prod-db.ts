import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const DB = "genderswap-fm";
const TABLES = ["songs", "covers"];

const wrangler = (...args: string[]) =>
  execFileSync("wrangler", args, { stdio: "inherit" });

const wranglerQuiet = (...args: string[]) =>
  execFileSync("wrangler", args, { stdio: ["inherit", "ignore", "inherit"] });

const dir = mkdtempSync(join(tmpdir(), "genderswap-db-"));

try {
  wrangler("d1", "migrations", "apply", DB, "--local");

  const data = TABLES.map((table) => {
    const output = join(dir, `${table}.sql`);
    wrangler(
      "d1",
      "export",
      DB,
      "--remote",
      "--no-schema",
      "--table",
      table,
      "--output",
      output,
    );
    return readFileSync(output, "utf8");
  });

  const reset = [
    "DELETE FROM covers;",
    "DELETE FROM cover_tags;",
    "DELETE FROM covers_fts;",
    "DELETE FROM tag_counts;",
    "DELETE FROM songs;",
  ].join("\n");

  const file = join(dir, "import.sql");
  writeFileSync(file, [reset, ...data].join("\n"));
  wranglerQuiet("d1", "execute", DB, "--local", "--file", file);
  console.log(`Replaced local ${TABLES.join(" and ")} with production data`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
