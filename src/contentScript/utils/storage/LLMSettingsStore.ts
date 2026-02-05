import {
  CVData,
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
