// Mirrors Postgres' `english` config ignoring stopwords
const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "is",
  "it",
  "of",
  "on",
  "the",
  "to",
  "with",
]);

const quote = (term: string) => `"${term.replace(/"/g, "")}"`;

// websearch-style input (terms, "phrases", or, -exclusions) -> safe FTS5 MATCH expression
export const toFtsQuery = (input: string): string | null => {
  const tokens = input.match(/-?"[^"]*"?|\S+/g) ?? [];

  const groups: string[][] = [[]];
  const exclusions: string[] = [];

  for (const raw of tokens) {
    const negated = raw.startsWith("-") && raw.length > 1;
    const token = negated ? raw.slice(1) : raw;
    const isPhrase = token.startsWith('"');
    const text = token.replace(/"/g, "").trim();

    if (!isPhrase && !negated && text.toLowerCase() === "or") {
      if (groups[groups.length - 1].length) groups.push([]);
      continue;
    }

    if (!/[\p{L}\p{N}]/u.test(text)) continue;
    if (!isPhrase && STOPWORDS.has(text.toLowerCase())) continue;

    if (negated) exclusions.push(quote(text));
    else groups[groups.length - 1].push(quote(text));
  }

  const positive = groups.filter((group) => group.length);
  if (!positive.length) return null;

  const query =
    positive.length > 1
      ? `(${positive
          .map((group) =>
            group.length > 1 ? `(${group.join(" AND ")})` : group[0],
          )
          .join(" OR ")})`
      : positive[0].join(" AND ");

  return exclusions.reduce((acc, term) => `${acc} NOT ${term}`, query);
};
