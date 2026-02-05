import { LocalStorageFile } from "@src/shared/utils/file"

export type LLMProvider = 'openai' | 'gemini' | 'anthropic'

export interface LLMModelConfig {
  id: string
  name: string
  provider: LLMProvider
}

export const LLM_MODELS: Record<LLMProvider, LLMModelConfig[]> = {
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' },
  ],
  gemini: [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3.0 Flash Preview', provider: 'gemini' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro Preview', provider: 'gemini' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'gemini' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'gemini' },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic' },
  ],
}

export interface LLMSettings {
  provider: LLMProvider
  apiKey: string
  model: string
  autoFillEnabled: boolean
  autoSaveLLMAnswers: boolean // Auto-save answers when AI suggests them
  includeHistoryContext: boolean
  confidenceThreshold: number // 0-1, below this triggers AI
}

export const DEFAULT_LLM_SETTINGS: LLMSettings = {
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4o-mini',
  autoFillEnabled: false,
  autoSaveLLMAnswers: false,
  includeHistoryContext: false,
  confidenceThreshold: 0.7,
}

export interface ExtractedCVData {
  personalInfo: {
    fullName?: string
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
    linkedIn?: string
    github?: string
    website?: string
  }
  summary?: string
  experience: Array<{
    company: string
    title: string
    location?: string
    startDate?: string
    endDate?: string
    current?: boolean
    description?: string
  }>
  education: Array<{
    institution: string
    degree?: string
    field?: string
    startDate?: string
    endDate?: string
    gpa?: string
  }>
  skills: string[]
  languages: Array<{
    language: string
    proficiency?: string
  }>
  certifications: Array<{
    name: string
    issuer?: string
    date?: string
  }>
  customFields: Record<string, string>
}

export interface CVData {
  originalText?: string
  originalFile?: LocalStorageFile
  extractedData?: ExtractedCVData
  lastProcessed?: number
}

export const DEFAULT_CV_DATA: CVData = {}

export interface JobContext {
  id: string
  name: string
  company?: string
  role?: string
  description?: string
  notes?: string
  createdAt: number
  updatedAt: number
}

export interface JobContextStore {
  contexts: JobContext[]
  activeContextId?: string
}

export const DEFAULT_JOB_CONTEXT_STORE: JobContextStore = {
  contexts: [],
  activeContextId: undefined,
}

// Background script message types
export type LLMMessageType =
  | 'LLM_PROCESS_CV'
  | 'LLM_SUGGEST_FIELD'
  | 'LLM_TEST_CONNECTION'
  | 'LLM_GENERATE_COVER_LETTER'
  | 'LLM_ANALYZE_CV'

export interface LLMMessage {
  type: LLMMessageType
  payload: any
}

export interface LLMProcessCVPayload {
  text?: string
  file?: LocalStorageFile
}

export interface LLMSuggestFieldPayload {
  fieldPath: {
    page?: string
    section: string
    fieldType: string
    fieldName: string
  }
  currentValue?: any
  cvData?: ExtractedCVData
  jobContext?: JobContext
  pastAnswers?: Array<{ fieldName: string; answer: any }>
}

export interface LLMResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Cover Letter types
export interface CoverLetterData {
  content: string
  jobContextId?: string
  generatedAt: number
  file?: LocalStorageFile
}

export interface CoverLetterStore {
  letters: CoverLetterData[]
  activeLetterId?: number
}

export const DEFAULT_COVER_LETTER_STORE: CoverLetterStore = {
  letters: [],
  activeLetterId: undefined,
}

export interface GenerateCoverLetterPayload {
  cvData: ExtractedCVData
  jobContext: JobContext
  tone?: 'professional' | 'friendly' | 'formal'
  length?: 'short' | 'medium' | 'long'
  customInstructions?: string
}

// CV Analysis types
export interface CVAnalysisResult {
  overallScore: number // 0-100
  keywordAnalysis: {
    matchingKeywords: Array<{
      keyword: string
      foundIn: 'cv' | 'both'
      importance: 'high' | 'medium' | 'low'
    }>
    missingKeywords: Array<{
      keyword: string
      importance: 'high' | 'medium' | 'low'
      suggestion: string
    }>
  }
  sections: {
    name: string
    score: number
    feedback: string
    improvements: string[]
  }[]
  strengths: string[]
  weaknesses: string[]
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low'
    category: string
    suggestion: string
    example?: string
  }>
  atsCompatibility: {
    score: number
    issues: string[]
    suggestions: string[]
  }
}

export interface AnalyzeCVPayload {
  cvText: string
  cvData?: ExtractedCVData
  jobContext: JobContext
}
