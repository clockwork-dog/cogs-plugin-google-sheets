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
  const tokens = Array.from(lexer.reset(row));
  return tokens
    .flatMap((token, index) =>
      token.type === "comma" && tokens[index + 1]?.type === "comma"
        ? [token, { type: "cell", value: "" } as const]
        : [token]
    )
    .filter((token) => token.type === "cell")
    .map((token) => token.value);
}
