import {
  CoverLetterData,
  CoverLetterStore,
  CVData,
  DEFAULT_COVER_LETTER_STORE,
  DEFAULT_CV_DATA,
  DEFAULT_JOB_CONTEXT_STORE,
  DEFAULT_LLM_SETTINGS,
  JobContext,
  JobContextStore,
  LLMSettings,
} from './LLMTypes'

const STORAGE_KEYS = {
  LLM_SETTINGS: 'llm_settings',
  CV_DATA: 'cv_data',
  JOB_CONTEXTS: 'job_contexts',
  COVER_LETTERS: 'cover_letters',
  GLOBAL_ACTIVATION: 'global_activation',
}

// Global Activation State
export async function getGlobalActivation(): Promise<boolean> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.GLOBAL_ACTIVATION)
  return result[STORAGE_KEYS.GLOBAL_ACTIVATION] ?? false
}

export async function setGlobalActivation(enabled: boolean): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.GLOBAL_ACTIVATION]: enabled })
}

// LLM Settings
export async function getLLMSettings(): Promise<LLMSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.LLM_SETTINGS)
  return result[STORAGE_KEYS.LLM_SETTINGS] || DEFAULT_LLM_SETTINGS
}

export async function setLLMSettings(settings: Partial<LLMSettings>): Promise<void> {
  const current = await getLLMSettings()
  const updated = { ...current, ...settings }
  await chrome.storage.local.set({ [STORAGE_KEYS.LLM_SETTINGS]: updated })
}

export async function clearLLMSettings(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEYS.LLM_SETTINGS)
}

// CV Data
export async function getCVData(): Promise<CVData> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.CV_DATA)
  return result[STORAGE_KEYS.CV_DATA] || DEFAULT_CV_DATA
}

export async function setCVData(data: Partial<CVData>): Promise<void> {
  const current = await getCVData()
  const updated = { ...current, ...data, lastProcessed: Date.now() }
  await chrome.storage.local.set({ [STORAGE_KEYS.CV_DATA]: updated })
}

export async function clearCVData(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEYS.CV_DATA)
}

// Job Contexts
export async function getJobContextStore(): Promise<JobContextStore> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.JOB_CONTEXTS)
  return result[STORAGE_KEYS.JOB_CONTEXTS] || DEFAULT_JOB_CONTEXT_STORE
}

export async function addJobContext(context: Omit<JobContext, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobContext> {
  const store = await getJobContextStore()
  const newContext: JobContext = {
    ...context,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  store.contexts.push(newContext)
  if (!store.activeContextId) {
    store.activeContextId = newContext.id
  }
  await chrome.storage.local.set({ [STORAGE_KEYS.JOB_CONTEXTS]: store })
  return newContext
}

export async function updateJobContext(id: string, updates: Partial<Omit<JobContext, 'id' | 'createdAt'>>): Promise<void> {
  const store = await getJobContextStore()
  const index = store.contexts.findIndex((c) => c.id === id)
  if (index !== -1) {
    store.contexts[index] = {
      ...store.contexts[index],
      ...updates,
      updatedAt: Date.now(),
    }
    await chrome.storage.local.set({ [STORAGE_KEYS.JOB_CONTEXTS]: store })
  }
}

export async function deleteJobContext(id: string): Promise<void> {
  const store = await getJobContextStore()
  store.contexts = store.contexts.filter((c) => c.id !== id)
  if (store.activeContextId === id) {
    store.activeContextId = store.contexts[0]?.id
  }
  await chrome.storage.local.set({ [STORAGE_KEYS.JOB_CONTEXTS]: store })
}

export async function setActiveJobContext(id: string): Promise<void> {
  const store = await getJobContextStore()
  if (store.contexts.some((c) => c.id === id)) {
    store.activeContextId = id
    await chrome.storage.local.set({ [STORAGE_KEYS.JOB_CONTEXTS]: store })
  }
}

export async function getActiveJobContext(): Promise<JobContext | undefined> {
  const store = await getJobContextStore()
  return store.contexts.find((c) => c.id === store.activeContextId)
}

// Cover Letters
export async function getCoverLetterStore(): Promise<CoverLetterStore> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.COVER_LETTERS)
  return result[STORAGE_KEYS.COVER_LETTERS] || DEFAULT_COVER_LETTER_STORE
}

export async function saveCoverLetter(letter: Omit<CoverLetterData, 'generatedAt'>): Promise<CoverLetterData> {
  const store = await getCoverLetterStore()
  const newLetter: CoverLetterData = {
    ...letter,
    generatedAt: Date.now(),
  }
  store.letters.push(newLetter)
  store.activeLetterId = store.letters.length - 1
  await chrome.storage.local.set({ [STORAGE_KEYS.COVER_LETTERS]: store })
  return newLetter
}

export async function getActiveCoverLetter(): Promise<CoverLetterData | undefined> {
  const store = await getCoverLetterStore()
  if (store.activeLetterId !== undefined && store.letters[store.activeLetterId]) {
    return store.letters[store.activeLetterId]
  }
  return store.letters[store.letters.length - 1]
}

export async function updateCoverLetter(index: number, updates: Partial<CoverLetterData>): Promise<void> {
  const store = await getCoverLetterStore()
  if (store.letters[index]) {
    store.letters[index] = { ...store.letters[index], ...updates }
    await chrome.storage.local.set({ [STORAGE_KEYS.COVER_LETTERS]: store })
  }
}

export async function deleteCoverLetter(index: number): Promise<void> {
  const store = await getCoverLetterStore()
  store.letters.splice(index, 1)
  if (store.activeLetterId === index) {
    store.activeLetterId = store.letters.length > 0 ? store.letters.length - 1 : undefined
  }
  await chrome.storage.local.set({ [STORAGE_KEYS.COVER_LETTERS]: store })
}

export async function setActiveCoverLetter(index: number): Promise<void> {
  const store = await getCoverLetterStore()
  if (store.letters[index]) {
    store.activeLetterId = index
    await chrome.storage.local.set({ [STORAGE_KEYS.COVER_LETTERS]: store })
  }
}
