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
import { contentScriptLogger as logger } from '@src/shared/utils/logger'

logger.info('Content script initializing...', { data: { url: window.location.href } })

// Regiser server and methods accessible to injected script.
const server = new Server(process.env.CONTENT_SCRIPT_URL)
logger.debug('Server created', { data: { serverUrl: process.env.CONTENT_SCRIPT_URL } })

server.register('addAnswer', async (newAnswer: Answer) => {
  logger.info('Adding new answer', { data: { fieldPath: newAnswer.fieldPath, fieldName: newAnswer.fieldName } })
  const answer1010 = answers1010.add(convert106To1010(newAnswer))
  logger.success('Answer added successfully', { data: { id: answer1010.id } })
  return convert1010To106(answer1010)
})

server.register('updateAnswer', async (newAnswer: Answer) => {
  logger.info('Updating answer', { data: { id: newAnswer.id, fieldName: newAnswer.fieldName } })
  const answer1010 = answers1010.update(
    convert106To1010(newAnswer) as SavedAnswer
  )
  logger.success('Answer updated successfully')
  return convert1010To106(answer1010)
})

server.register('getAnswer', async (fieldPath: FieldPath) => {
  logger.debug('Searching for answer', { data: { fieldPath } })
  const results = answers1010.search(fieldPath).map((record) => convert1010To106(record))
  logger.info(`Found ${results.length} matching answer(s)`, { data: { results } })
  return results
})

server.register('deleteAnswer', async (id: number) => {
  logger.info('Deleting answer', { data: { id } })
  const result = answers1010.delete(id)
  logger.success('Answer deleted successfully')
  return result
})logger.group('🤖 Getting LLM Suggestion', false)
  logger.info('Request received', { data: { fieldPath: payload.fieldPath } })
  
  const settings = await getLLMSettings()
  logger.debug('LLM settings loaded', { data: { provider: settings.provider, model: settings.model, hasApiKey: !!settings.apiKey } })
  
  if (!settings.apiKey) {
    logger.warn('API key not configured')
    logger.groupEnd()
    return { success: false, error: 'API key not configured' }
  }

  // Get CV data and job context
  const cvData = await getCVData()
  const jobContext = await getActiveJobContext()
  logger.debug('Context loaded', { data: { hasCVData: !!cvData.extractedData, hasJobContext: !!jobContext } })

  // Get past answers if enabled
  let pastAnswers: Array<{ fieldName: string; answer: any }> | undefined
  if (settings.includeHistoryContext) {
    const allAnswers = answers1010.getAll()
    pastAnswers = allAnswers.slice(0, 20).map(a => ({
      fieldName: a.fieldName,
      answer: a.answer,
    }))
    logger.debug(`Including ${pastAnswers.length} past answers in context`)
  }

  logger.info('Sending request to background script...')
  // Call background script to get LLM suggestion
  const response = await chrome.runtime.sendMessage({
    type: 'LLM_SUGGEST_FIELD',
    payload: {
      fieldPath: payload.fieldPath,
      currentValue: payload.currentValue,
      cvData: cvData.extractedData,
      jobContext,
      pastAnswers,
    },
  })
  
  if (response.success) {
    logger.success('LLM suggestion received', { data: { suggestion: response.suggestion } })
  } else {
    logger.error('LLM request failed', response.error)
  }
  logger.groupEnd()
  
  return responsetype: 'LLM_SUGGEST_FIELD',
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

//logger.time('Content script initialization')
  try {
    logger.info('Loading answers from storage...')
    await answers1010.load()
    logger.success(`Loaded ${answers1010.getAll().length} saved answers`)
    
    logger.info('Running migrations...')
    await migrate1010()
    await migrateEducation()
    logger.success('Migrations completed')
    
    logger.info('Injecting main script into page...')
    injectScript('inject.js')
    logger.success('Script injected successfully')
    
    logger.info('Loading main app UI...')
    loadApp()
    logger.success('Main app loaded')
    
    logger.timeEnd('Content script initialization')
    logger.success('✨ JobAppFiller content script ready!')
  } catch (error) {
    logger.error('Failed to initialize content script', error)
  }tAttribute('async', 'true')
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
