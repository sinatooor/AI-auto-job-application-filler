import { Server } from '@src/shared/utils/crossContextCommunication/server'
import { FieldPath, Answer } from '@src/shared/utils/types'
import { EVENT_LISTENER_ID, loadApp } from './app/App'
import { answers1010, migrate1010 } from './utils/storage/Answers1010'
import { convert106To1010, convert1010To106 } from './utils/storage/DataStore'
import { SavedAnswer } from './utils/storage/DataStoreTypes'
import { migrateEducation } from './utils/storage/migrateEducationSectionNames'
import { 
  getCVData, 
  getActiveJobContext, 
  getLLMSettings 
} from './utils/storage/LLMSettingsStore'

// Regiser server and methods accessible to injected script.
const server = new Server(process.env.CONTENT_SCRIPT_URL)
server.register('addAnswer', async (newAnswer: Answer) => {
  const answer1010 = answers1010.add(convert106To1010(newAnswer))
  return convert1010To106(answer1010)
})

server.register('updateAnswer', async (newAnswer: Answer) => {
  const answer1010 = answers1010.update(
    convert106To1010(newAnswer) as SavedAnswer
  )
  return convert1010To106(answer1010)
})

server.register('getAnswer', async (fieldPath: FieldPath) => {
  return answers1010.search(fieldPath).map((record) => convert1010To106(record))
})

server.register('deleteAnswer', async (id: number) => {
  return answers1010.delete(id)
})

// LLM-related methods
server.register('getLLMSettings', async () => {
  return getLLMSettings()
})

server.register('getLLMSuggestion', async (payload: { fieldPath: FieldPath, currentValue?: any }) => {
  const settings = await getLLMSettings()
  if (!settings.apiKey) {
    return { success: false, error: 'API key not configured' }
  }

  // Get CV data and job context
  const cvData = await getCVData()
  const jobContext = await getActiveJobContext()

  // Get past answers if enabled
  let pastAnswers: Array<{ fieldName: string; answer: any }> | undefined
  if (settings.includeHistoryContext) {
    const allAnswers = answers1010.getAll()
    pastAnswers = allAnswers.slice(0, 20).map(a => ({
      fieldName: a.fieldName,
      answer: a.answer,
    }))
  }

  // Call background script to get LLM suggestion
  return chrome.runtime.sendMessage({
    type: 'LLM_SUGGEST_FIELD',
    payload: {
      fieldPath: payload.fieldPath,
      currentValue: payload.currentValue,
      cvData: cvData.extractedData,
      jobContext,
      pastAnswers,
    },
  })
})

server.register('getAnswerConfidence', async (fieldPath: FieldPath) => {
  const results = answers1010.search(fieldPath)
  if (results.length === 0) {
    return { hasAnswer: false, confidence: 0 }
  }
  
  const bestMatch = results[0]
  let confidence = 0
  
  if (bestMatch.matchType === 'exact') {
    confidence = 1.0
  } else if (bestMatch.matchType?.startsWith('Similar:')) {
    // Extract score from "Similar: 0.xxx"
    const scoreStr = bestMatch.matchType.replace('Similar: ', '')
    confidence = parseFloat(scoreStr) || 0
  }
  
  return { hasAnswer: true, confidence, answer: convert1010To106(bestMatch) }
})

// inject script
function injectScript(filePath: string) {
  const script = document.createElement('script')
  script.src = chrome.runtime.getURL(filePath)
  script.setAttribute('async', 'true')
  script.type = 'module'
  script.onload = function () {
    script.remove()
  }
  ;(document.head || document.documentElement).appendChild(script)
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SHOW_WHATS_NEW') {
    document.dispatchEvent(new CustomEvent(EVENT_LISTENER_ID))
  }
})

const run = async () => {
  await answers1010.load()
  await migrate1010()
  await migrateEducation()
  injectScript('inject.js')
  loadApp()
}

run()
