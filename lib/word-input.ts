export type InputLanguage = "dutch" | "english";

export function parseWordList(input: string): string[] {
  const seen = new Set<string>();
  const words: string[] = [];

  for (const part of input.split(",")) {
    const word = part.trim();
    if (!word) continue;
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    words.push(word);
  }

  return words;
}

export function spellCheckLang(language: InputLanguage): string {
  return language === "dutch" ? "nl" : "en";
}
