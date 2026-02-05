import elasticlunr from 'elasticlunr'
import { NewAnswer, SavedAnswer } from './DataStoreTypes'
import { Answer, FieldPath } from '@src/shared/utils/types'
import { storageLogger as logger } from '@src/shared/utils/logger'
import {
  fieldTypeCompatible,
  semanticFieldMatch,
  FuzzyCandidate,
} from '@src/shared/utils/fuzzyMatch'

export const convert106To1010 = (
  answer106: Answer
): NewAnswer | SavedAnswer => {
  const answer1010 = { answer: answer106.answer, ...answer106.path }
  const { matchType, id } = answer106
  if (id !== undefined) {
    ;(answer1010 as SavedAnswer).id = id
  }
  if (matchType !== undefined) {
    ;(answer1010 as SavedAnswer).matchType = matchType
  }
  return answer1010
}

export const convert1010To106 = (
  answer1010: NewAnswer | SavedAnswer
): Answer => {
  const { section, fieldType, fieldName, answer, id, matchType } =
    answer1010 as SavedAnswer
  return { answer, id, matchType, path: { section, fieldName, fieldType } }
}

const tsIndex = () => {
  const index = elasticlunr<{ fieldName: string; id: number }>()
    .addField('fieldName')
    .addField('id')
  return index
}

class ExactMatchIndex {
  store: { [key: string]: number[] }
  constructor() {
    this.store = {}
  }
  add(key: string, id: number) {
    const ids = this.store[key] || []
    if (!ids.includes(id)) {
      ids.push(id)
    }
    this.store[key] = ids
  }

  delete(key: string, id: number) {
    let ids = this.store[key] || []
    ids = ids.filter((i) => i !== id)
    if (ids.length === 0) {
      delete this.store[key]
    }
  }

  get(key: string): number[] {
    return this.store[key] || []
  }
}

export class DataStore {
  store: Map<number, SavedAnswer>
  autoIncrement: number
  name: string
  loaded: boolean
  exactMatchIndex: ExactMatchIndex
  ts_index: elasticlunr.Index<{
    fieldName: string
    id: number
  }>

  constructor(name: string) {
    this.name = name
    this.store = new Map()
    this.autoIncrement = 0 // Auto-incrementing ID counter
    this.exactMatchIndex = new ExactMatchIndex()
    this.ts_index = tsIndex()

    this.loaded = false
  }
  // BUT WHAT ABOUT DATE VALUES AND ARRAY VALUES.
  findExisting(newAnswer: NewAnswer): SavedAnswer | null {
    return this.exactSearch(newAnswer.fieldName).find((savedAnswer) => {
      return Object.entries(newAnswer).every(([key, value]) => {
        return JSON.stringify(savedAnswer[key]) === JSON.stringify(value)
      })
    })
  }

  // Method to add a new item, auto-generating an ID
  add(item: NewAnswer, id: number = null): SavedAnswer {
    if (!this.loaded) {
      throw new Error('load it first')
    }
    id = id || this.autoIncrement++ // Increment the ID
    const existingMatch = this.findExisting(item)
    if (existingMatch) {
      logger.debug('Found existing answer, returning it', { data: { id: existingMatch.id, fieldName: item.fieldName } })
      return existingMatch
    }
    const savedAnswer = { ...item, id }
    this.store.set(id, savedAnswer) // Store the item with the new ID
    this.exactMatchIndex.add(item.fieldName, id)
    this.ts_index.addDoc({ fieldName: item.fieldName, id })
    logger.success('Answer added to store', { 
      data: { 
        id, 
        fieldName: item.fieldName,
        totalAnswers: this.store.size 
      } 
    })
    this.persist() // Persist the data to chrome.storage.local
    return savedAnswer // Return the assigned ID
  }

  // Method to retrieve an item by ID
  get(id: number): SavedAnswer {
    const result = this.store.get(id)
    logger.debug('Retrieved answer by ID', { data: { id, found: !!result } })
    return result
  }

  // Method to remove an item by ID
  delete(id: number) {
    if (!this.loaded) {
      throw new Error('load it first')
    }
    const record = this.store.get(id)
    if (record) {
      this.exactMatchIndex.delete(record.fieldName, id)
      this.ts_index.removeDoc({ fieldName: record.fieldName, id })
      this.store.delete(id)
      logger.success('Answer deleted from store', { 
        data: { 
          id, 
          fieldName: record.fieldName,
          remainingAnswers: this.store.size 
        } 
      })
      this.persist()
      return true
    }
    logger.warn('Answer not found for deletion', { data: { id } })
    return false
  }

  update(item: SavedAnswer): SavedAnswer {
    if (!this.loaded) {
      throw new Error('load it first')
    }
    const old = this.get(item.id)
    if (old) {
      this.delete(old.id)
    }
    this.add(item, item.id)
    logger.success('Answer updated in store', { data: { id: item.id, fieldName: item.fieldName } })
    return item
  }

  // Method to retrieve all items
  getAll() {
    return Array.from(this.store.values())
  }

  // Persist the store and current ID to chrome.storage.local
  async persist() {
    if (!this.loaded) {
      throw new Error('load it first')
    }
    const data = {
      store: Array.from(this.store.entries()), // Convert Map to array for storage
      autoIncrement: this.autoIncrement,
    }
    logger.debug('Persisting data to chrome storage', { 
      data: { 
        storeName: this.name, 
        itemCount: this.store.size,
        autoIncrement: this.autoIncrement 
      } 
    })
    await chrome.storage.local.set({ [this.name]: data })
  }

  // Load the store and current ID from chrome.storage.local
  async load() {
    logger.info(`Loading data store: ${this.name}`)
    logger.time(`Load ${this.name}`)
    
    const result = await chrome.storage.local.get(this.name)
    if (result[this.name]) {
      const { store, autoIncrement } = result[this.name]
      this.store = new Map(store) // Convert array back to Map
      this.autoIncrement = autoIncrement // Restore the current ID
      store.forEach(([id, { fieldName }]) => {
        this.exactMatchIndex.add(fieldName, id)
        this.ts_index.addDoc({ fieldName, id })
      })
      logger.success(`Loaded ${this.store.size} items from storage`)
    } else {
      logger.info('No existing data found, starting fresh')
    }
    this.loaded = true
    logger.timeEnd(`Load ${this.name}`)
  }

  exactSearch(fieldName: string): SavedAnswer[] {
    const matchingIds = this.exactMatchIndex.get(fieldName)
    logger.debug('Exact match search', { 
      data: { 
        fieldName, 
        matchCount: matchingIds.length 
      } 
    })
    return matchingIds.map((id: number) => {
      return { ...this.get(id), matchType: 'exact' }
    })
  }

  tsSearch(fieldName: string): SavedAnswer[] {
    const results = this.ts_index.search(fieldName, {})
    logger.debug('Text search', { 
      data: { 
        fieldName, 
        matchCount: results.length,
        topScore: results[0]?.score 
      } 
    })
    return results.map(({ ref, score }) => {
      return { ...this.get(parseInt(ref)), matchType: `Similar: ${score}` }
    })
  }

  pushResults(results: SavedAnswer[], matches: SavedAnswer[]) {
    const currentIds = results.map(({ id }) => id)
    matches.forEach((match) => {
      if (!currentIds.includes(match.id)) {
        results.push(match)
      }
    })
  }

  /**
   * Run fuzzy (Levenshtein) matching across every stored fieldName.
   * Returns SavedAnswers annotated with a "Fuzzy: <score>" matchType.
   */
  fuzzySearch(fieldName: string): SavedAnswer[] {
    const candidates: FuzzyCandidate[] = this.getAll().map((sa) => ({
      id: sa.id,
      fieldName: sa.fieldName,
    }))
    return semanticFieldMatch(fieldName, candidates, 0.4).map(({ id, score }) => ({
      ...this.get(id),
      matchType: `Fuzzy: ${score.toFixed(3)}`,
    }))
  }

  search({ fieldName, section, fieldType }: FieldPath): SavedAnswer[] {
    logger.group(`🔍 Searching for answer`, true)
    logger.debug('Search criteria', { data: { fieldName, section, fieldType } })
    logger.time('Answer search')
    
    const limit = 10
    // get matches
    const exactMatches = this.exactSearch(fieldName)
    const tsMatches = this.tsSearch(fieldName)
    const fuzzyMatches = this.fuzzySearch(fieldName)
    
    // combine matches (exact first, then text-search, then fuzzy)
    const results: SavedAnswer[] = []
    this.pushResults(results, exactMatches)
    this.pushResults(results, tsMatches)
    this.pushResults(results, fuzzyMatches)
    
    logger.debug(`Combined ${results.length} total matches`)
    
    // filter matches — use relaxed fieldType comparison
    const filteredResults = results.filter((answer: SavedAnswer) => {
      return fieldTypeCompatible(answer.fieldType, fieldType) && answer.section === section
    })
    
    logger.timeEnd('Answer search')
    logger.success(`Found ${filteredResults.length} matching answer(s)`, { 
      data: { 
        exactMatches: exactMatches.length,
        similarMatches: tsMatches.length,
        fuzzyMatches: fuzzyMatches.length,
        afterFilter: filteredResults.length 
      } 
    })
    logger.groupEnd()
    
    return filteredResults.slice(0, limit)
  }

  /**
   * Cross-type probable-value search.
   * Ignores fieldType and section — ranks ALL stored answers by fuzzy
   * similarity to the given fieldName.
   * Returns up to `limit` results sorted by descending similarity score.
   */
  searchProbable(fieldName: string, limit: number = 5): SavedAnswer[] {
    logger.group(`🔮 Searching probable values`, true)
    logger.debug('Probable search criteria', { data: { fieldName } })
    logger.time('Probable search')

    const candidates: FuzzyCandidate[] = this.getAll().map((sa) => ({
      id: sa.id,
      fieldName: sa.fieldName,
    }))

    const fuzzyResults = semanticFieldMatch(fieldName, candidates, 0.35)

    const results: SavedAnswer[] = fuzzyResults.map(({ id, score }) => ({
      ...this.get(id),
      matchType: `Probable: ${score.toFixed(3)}`,
    }))

    logger.timeEnd('Probable search')
    logger.success(`Found ${results.length} probable value(s)`, {
      data: { fieldName, total: results.length },
    })
    logger.groupEnd()

    return results.slice(0, limit)
  }
}
