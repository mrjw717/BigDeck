/**
 * Split a label into TOP + BOTTOM strips for `labelPosition: "split"`.
 *
 * Greedy word fill (space-separated, never mid-word): words are added to the
 * top strip while they fit within `maxChars`; the remainder goes to the
 * bottom strip. A label that fits entirely renders on the top strip only.
 * Both sides (hardware renderer + UI preview) call this so splitting is
 * identical everywhere.
 */
export function splitLabelWords(
  label: string,
  maxChars: number,
): { top: string; bottom: string } {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return { top: "", bottom: "" };

  const budget = Math.max(1, Math.floor(maxChars));
  const top: string[] = [];
  let len = 0;
  let i = 0;

  for (; i < words.length; i++) {
    const candidate = top.length ? `${top.join(" ")} ${words[i]}` : words[i];
    if (candidate.length > budget && top.length > 0) break;
    top.push(words[i]);
    len = candidate.length;
  }

  // A single word longer than the budget still lives on top (never cropped).
  const bottom = words.slice(i).join(" ");
  return { top: top.join(" "), bottom };
}
