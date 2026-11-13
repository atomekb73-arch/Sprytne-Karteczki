/**
 * Narzędzia do wykrywania podobieństwa tekstu i obsługi duplikatów
 */

// Krótkie spójniki, przyimki i słowa pomijane w języku polskim
const POLISH_STOP_WORDS = new Set([
  "oraz", "albo", "zeby", "ze", "czy", "tak", "nie", "dla", "przy", "przez",
  "nad", "pod", "przed", "jako", "jest", "sa", "oraz", "wiec", "tylko", "moze",
  "tego", "tych", "tym", "tam", "tutaj", "juz", "jeszcze", "bardzo", "duzo",
  "malo", "brak", "nowy", "nowa", "nowe", "nasz", "nasza", "nasze", "wasz"
]);

/**
 * Usuwa polskie znaki diakrytyczne i normalizuje do małych liter
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "l")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Wyciąga słowa kluczowe o długości min. 4 znaków, pomijając spójniki
 */
export function extractKeywords(text: string): string[] {
  const normalized = normalizeText(text);
  return normalized
    .split(" ")
    .filter((word) => word.length >= 4 && !POLISH_STOP_WORDS.has(word));
}

export interface DuplicateMatch<T> {
  item: T;
  matchedWords: string[];
  score: number;
}

/**
 * Szuka najbardziej podobnego elementu w zbiorze na podstawie wspólnych słów kluczowych
 */
export function findSimilarItem<T extends { content: string }>(
  input: string,
  items: T[],
  minKeywordLength = 4
): DuplicateMatch<T> | null {
  if (!input || input.trim().length < 10 || items.length === 0) {
    return null;
  }

  const inputKeywords = new Set(extractKeywords(input));
  if (inputKeywords.size === 0) {
    return null;
  }

  let bestMatch: DuplicateMatch<T> | null = null;
  let maxScore = 0;

  for (const item of items) {
    const itemKeywords = extractKeywords(item.content);
    if (itemKeywords.length === 0) continue;

    const matchedWords = itemKeywords.filter((w) => inputKeywords.has(w));
    if (matchedWords.length === 0) continue;

    // Prosty wskaźnik Jaccarda lub ważona liczba wspólnych słów
    const uniqueMatched = Array.from(new Set(matchedWords));
    const score = uniqueMatched.length;

    if (score > maxScore && score >= 1) {
      maxScore = score;
      bestMatch = {
        item,
        matchedWords: uniqueMatched,
        score,
      };
    }
  }

  return bestMatch;
}
