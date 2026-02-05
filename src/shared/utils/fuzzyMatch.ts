/**
 * Fuzzy/semantic field name matching utilities.
 *
 * The main idea: strip digits, special chars and whitespace so that field
 * identifiers like "02frstname" normalise to "frstname", then use
 * Levenshtein-based similarity to compare against stored field names.
 */

/**
 * Normalise a field name for comparison.
 * - lowercase
 * - remove leading/trailing whitespace
 * - strip digits
 * - strip all non-alpha characters (underscores, dashes, spaces, etc.)
 */
export function normalizeFieldName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[0-9]/g, '')       // strip digits
    .replace(/[^a-z]/g, '')      // keep only a-z
}

/**
 * Standard Levenshtein edit-distance (insert / delete / substitute).
 * Uses a single-row DP approach for O(min(m,n)) space.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  // Ensure `a` is the shorter string for the single-row optimisation.
  if (a.length > b.length) [a, b] = [b, a]

  const aLen = a.length
  const bLen = b.length
  let prev = new Array(aLen + 1)
  let curr = new Array(aLen + 1)

  for (let i = 0; i <= aLen; i++) prev[i] = i

  for (let j = 1; j <= bLen; j++) {
    curr[0] = j
    for (let i = 1; i <= aLen; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[i] = Math.min(
        curr[i - 1] + 1,     // insert
        prev[i] + 1,         // delete
        prev[i - 1] + cost   // substitute
      )
    }
    ;[prev, curr] = [curr, prev]
  }

  return prev[aLen]
}

/**
 * Return a similarity score in [0, 1] between two field names.
 * 1 = identical (after normalisation), 0 = completely different.
 */
export function similarityScore(a: string, b: string): number {
  const na = normalizeFieldName(a)
  const nb = normalizeFieldName(b)
  if (na.length === 0 && nb.length === 0) return 1
  if (na.length === 0 || nb.length === 0) return 0
  const maxLen = Math.max(na.length, nb.length)
  const dist = levenshteinDistance(na, nb)
  return 1 - dist / maxLen
}

export interface FuzzyCandidate {
  id: number
  fieldName: string
}

export interface FuzzyResult {
  id: number
  score: number
}

/**
 * Rank a set of candidates by how closely their `fieldName` matches `query`.
 * Returns results sorted descending by score, filtered to `score >= threshold`.
 */
export function semanticFieldMatch(
  query: string,
  candidates: FuzzyCandidate[],
  threshold: number = 0.4
): FuzzyResult[] {
  return candidates
    .map(({ id, fieldName }) => ({
      id,
      score: similarityScore(query, fieldName),
    }))
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score)
}

/**
 * Map of field-type aliases that should be treated as compatible.
 * Keys are normalised (lowercase). Each group of types is interchangeable.
 */
const FIELD_TYPE_GROUPS: string[][] = [
  ['text', 'textinput'],
  ['textarea'],
]

const fieldTypeNorm = (ft: string) => ft.toLowerCase().trim()

/**
 * Returns true when two fieldType strings should be considered compatible
 * for matching purposes (e.g. 'text' ↔ 'TextInput').
 */
export function fieldTypeCompatible(a: string, b: string): boolean {
  const na = fieldTypeNorm(a)
  const nb = fieldTypeNorm(b)
  if (na === nb) return true
  for (const group of FIELD_TYPE_GROUPS) {
    if (group.includes(na) && group.includes(nb)) return true
  }
  return false
}
