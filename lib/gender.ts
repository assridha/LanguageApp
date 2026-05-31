import type { DutchArticle, DutchGender } from "@/types";

export function normalizeArticleAndGender(input: {
  article?: DutchArticle | null;
  gender?: DutchGender | null;
}): { article: DutchArticle | null; gender: DutchGender | null } {
  let article = input.article ?? null;
  let gender = input.gender ?? null;

  if (article === "het") {
    gender = "neuter";
  }

  if (gender === "neuter") {
    article = "het";
  }

  if (gender === "masculine" || gender === "feminine") {
    article = "de";
  }

  if (article === "de" && gender === "neuter") {
    gender = null;
  }

  if (article === "het" && gender && gender !== "neuter") {
    gender = "neuter";
  }

  return { article, gender };
}

export function formatDutchWordWithArticle(
  dutchWord: string,
  article?: DutchArticle | null,
): string {
  if (!article) return dutchWord;
  return `${article} ${dutchWord}`;
}

export function genderLabel(gender?: DutchGender | null): string | null {
  if (!gender) return null;
  switch (gender) {
    case "masculine":
      return "Masculine";
    case "feminine":
      return "Feminine";
    case "neuter":
      return "Neuter";
  }
}

export function articleGenderSummary(
  article?: DutchArticle | null,
  gender?: DutchGender | null,
): string | null {
  if (!article && !gender) return null;
  const parts: string[] = [];
  if (article) parts.push(article);
  if (gender) parts.push(genderLabel(gender) ?? gender);
  return parts.join(" · ");
}
