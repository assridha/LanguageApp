function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function textContainsWord(text: string, word: string): boolean {
  const trimmed = word.trim();
  if (!trimmed) return false;

  const pattern = new RegExp(`\\b${escapeRegex(trimmed)}\\b`, "i");
  return pattern.test(text);
}

function capitalizeLike(source: string, target: string): string {
  if (!target) return target;
  if (source[0] === source[0]?.toUpperCase()) {
    return target.charAt(0).toUpperCase() + target.slice(1);
  }
  return target;
}

export function sanitizeDefinitionForPrompt(
  definition: string,
  dutchWord: string,
  englishWord?: string | null,
): string {
  const replacement = englishWord?.trim() || "this word";
  const pattern = new RegExp(`\\b${escapeRegex(dutchWord.trim())}\\b`, "gi");

  return definition.replace(pattern, (match) =>
    capitalizeLike(match, replacement),
  );
}

export function isDefinitionSafeForTesting(
  definition: string,
  dutchWord: string,
): boolean {
  return !textContainsWord(definition, dutchWord);
}

export function buildDefinitionInstructions(dutchWord: string): string {
  return `
- englishDefinition: one short learner-friendly English sentence explaining the meaning
- The englishDefinition is shown in "definition → Dutch word" quizzes, so it MUST NOT contain the Dutch word "${dutchWord}" or any Dutch text
- Refer to the meaning using englishWord (e.g. start with the English translation) or neutral wording ("This is...", "Used to...")
- Must not be only the englishWord repeated`;
}
