function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

export function gradeDutchWord(
  expected: string,
  answer: string,
): boolean {
  return normalize(expected) === normalize(answer);
}

export function gradeDefinition(
  expected: string,
  answer: string,
  threshold = 0.6,
): boolean {
  const expectedTokens = tokenize(expected);
  const answerTokens = tokenize(answer);

  if (expectedTokens.length === 0) {
    return normalize(expected) === normalize(answer);
  }

  if (answerTokens.length === 0) return false;

  const expectedSet = new Set(expectedTokens);
  const overlap = answerTokens.filter((t) => expectedSet.has(t)).length;
  const ratio = overlap / expectedTokens.length;

  return ratio >= threshold || normalize(expected) === normalize(answer);
}

export function gradeAnswer(
  type: "imageToWord" | "definitionToWord" | "wordToDefinition",
  expected: string,
  answer: string,
): boolean {
  if (type === "wordToDefinition") {
    return gradeDefinition(expected, answer);
  }
  return gradeDutchWord(expected, answer);
}
