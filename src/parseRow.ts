import moo from "moo";

const lexer = moo.compile({
  cell: {
    match: /(?:\\,|[^,])+/,
    lineBreaks: true,
    value: (str) => str.replace(/\\,/g, ",").replace(/\\n/, "\n"),
  },
  comma: ",",
});

export default function parseRow(row: string): string[] {
  return Array.from(lexer.reset(row))
    .filter((token) => token.type === "cell")
    .map((token) => token.value);
}
