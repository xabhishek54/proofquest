import { StreamLanguage, StringStream } from "@codemirror/language";

const LEAN_KEYWORDS = new Set([
  "theorem", "def", "inductive", "structure", "macro", "open", "import",
  "by", "where", "deriving", "example", "let", "have", "in", "with", "do"
]);

const LEAN_TACTICS = new Set([
  "swap", "paint", "rotate_row", "finish", "rfl", "apply", "refine", "exact"
]);

const LEAN_COLORS = new Set([
  "red", "blue", "green", "yellow", "purple", "orange"
]);

export const leanLanguage = StreamLanguage.define({
  name: "lean4",
  token(stream: StringStream) {
    if (stream.eatSpace()) return null;

    // Line comment
    if (stream.match(/^--.*/)) {
      return "comment";
    }

    // String literal
    if (stream.match(/^"([^"\\]|\\.)*"/)) {
      return "string";
    }

    // Numbers
    if (stream.match(/^\d+/)) {
      return "number";
    }

    // Identifiers and words
    const match = stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
    if (match) {
      const word = stream.current();
      if (LEAN_KEYWORDS.has(word)) return "keyword";
      if (LEAN_TACTICS.has(word)) return "def";
      if (LEAN_COLORS.has(word)) return "atom";
      return "variable";
    }

    // Fallback: advance character
    stream.next();
    return null;
  }
});
