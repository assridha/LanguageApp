export class WordValidationError extends Error {
  constructor(
    message: string,
    public word: string,
    public suggestion?: string,
  ) {
    super(message);
    this.name = "WordValidationError";
  }
}

export class DuplicateWordError extends Error {
  constructor(
    message: string,
    public dutchWord: string,
    public existingCardId: string,
    public inputWord?: string,
  ) {
    super(message);
    this.name = "DuplicateWordError";
  }
}
