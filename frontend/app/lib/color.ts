export const labelColors = [
  "tomato",
  "jade",
  "cobalt",
  "marigold",
  "plum",
] as const;

export type LabelColor = (typeof labelColors)[number];

/** A stable color per string (short code, username), so an item keeps its color across visits. */
export function colorFor(value: string): LabelColor {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return labelColors[Math.abs(hash) % labelColors.length];
}
