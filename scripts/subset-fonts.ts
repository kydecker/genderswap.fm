import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";

const SOURCE = "fonts";
const OUTPUT = "static/fonts";

const CORE = [
  "U+0000-00FF",
  "U+0131",
  "U+0152-0153",
  "U+02BB-02BC",
  "U+02C6",
  "U+02DA",
  "U+02DC",
  "U+2000-206F",
  "U+20AC",
  "U+2122",
  "U+2212",
];

const EXTENDED = [
  "U+0100-0130",
  "U+0132-0151",
  "U+0154-02AF",
  "U+0300-036F",
  "U+1E00-1EFF",
];

const WEB_FEATURES = ["salt", "ss01", "ss02", "ss03", "ss04", "tnum"];

const subset = (
  input: string,
  output: string,
  unicodes: string[],
  args: string[],
) => {
  execFileSync(
    "pyftsubset",
    [
      input,
      `--output-file=${output}`,
      `--unicodes=${unicodes.join(",")}`,
      "--no-hinting",
      "--desubroutinize",
      "--name-IDs=1,2",
      "--no-glyph-names",
      ...args,
    ],
    { stdio: "inherit" },
  );
  console.log(
    `${basename(output)}: ${(statSync(input).size / 1024).toFixed(1)} KB → ${(statSync(output).size / 1024).toFixed(1)} KB`,
  );
};

rmSync(OUTPUT, { recursive: true, force: true });
mkdirSync(OUTPUT, { recursive: true });

for (const file of readdirSync(SOURCE)) {
  const input = join(SOURCE, file);
  const name = basename(file, extname(file));

  if (extname(file) === ".ttf") {
    subset(input, join(OUTPUT, file), [...CORE, ...EXTENDED], []);
  } else if (extname(file) === ".woff2") {
    const args = [
      `--layout-features+=${WEB_FEATURES.join(",")}`,
      "--flavor=woff2",
    ];
    subset(input, join(OUTPUT, file), CORE, args);
    subset(input, join(OUTPUT, `${name}-Ext.woff2`), EXTENDED, args);
  }
}
