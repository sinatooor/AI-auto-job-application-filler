import { getLLMSettings } from '@src/contentScript/utils/storage/LLMSettingsStore'
import {
  AnalyzeCVPayload,
  GenerateCoverLetterPayload,
  LLMMessage,
  LLMProcessCVPayload,
  LLMResponse,
  LLMSuggestFieldPayload,
} from '@src/contentScript/utils/storage/LLMTypes'
import { analyzeCV, generateCoverLetter, processCV, suggestFieldValue, testConnection } from './services/llmClient'
import { backgroundLogger as logger } from '@src/shared/utils/logger'

logger.success('🎯 JobAppFiller background service worker started')

// Handle messages from content scripts and popup/options
chrome.runtime.onMessage.addListener(
  (
    message: LLMMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: LLMResponse) => void
  ) => {
    logger.group(`📨 Message received: ${message.type}`, true)
    logger.debug('Message details', { data: { sender: sender.tab?.url, message } })
    
    handleMessage(message)
      .then((response) => {
        if (response.success) {
          logger.success('Message handled successfully')
        } else {
          logger.warn('Message handled with error', { data: { error: response.error } })
        }
        logger.groupEnd()
        sendResponse(response)
      })
      .catch((error) => {
        logger.error('Unexpected error handling message', error)
        logger.groupEnd()
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      })

    // Return true to indicate async response
    return true
  }
)

async function handleMessage(message: LLMMessage): Promise<LLMResponse> {
  logger.info(`Processing message type: ${message.type}`)
  
  const settings = await getLLMSettings()
  logger.debug('Settings loaded', { data: { provider: settings.provider, model: settings.model, hasApiKey: !!settings.apiKey } })

  if (!settings.apiKey && message.type !== 'LLM_TEST_CONNECTION') {
    logger.warn('API key not configured')
    return { success: false, error: 'API key not configured. Please set up your LLM provider in settings.' }
  }

  const config = {
    provider: settings.provider,
    apiKey: settings.apiKey,
    model: settings.model,
  }

  switch (message.type) {
    case 'LLM_TEST_CONNECTION': {
      logger.info('Testing LLM connection...')
      // Allow passing custom config for testing
      const testConfig = message.payload?.apiKey ? {
        provider: message.payload.provider || settings.provider,
        apiKey: message.payload.apiKey,
        model: message.payload.model || settings.model,
      } : config

      logger.debug('Test config', { data: { provider: testConfig.provider, model: testConfig.model } })
      const result = await testConnection(testConfig)
      
      if (result.success) {
        logger.success('Connection test passed')
      } else {
        logger.error('Connection test failed', result.error)
      }
      
      return {
        success: result.success,
        message: result.success ? 'Connection successful!' : result.error,
      }
    }

    case 'LLM_PROCESS_CV': {
      logger.info('Processing CV...')
      const payload = message.payload as LLMProcessCVPayload
      if (!payload.text) {
        logger.warn('No CV text provided')
        return { success: false, error: 'No CV text provided' }
      }
      logger.debug('CV text length', { data: { length: payload.text.length } })
      const result = await processCV(config, payload.text)
      if (result.success) {
        logger.success('CV processed successfully')
      } else {
        logger.error('CV processing failed', result.error)
      }
      return result
    }

    case 'LLM_SUGGEST_FIELD': {
      logger.info('Generating field suggestion...')
      const payload = message.payload as LLMSuggestFieldPayload
      logger.debug('Field suggestion request', { 
        data: { 
          fieldPath: payload.fieldPath,
          hasCVData: !!payload.cvData,
          hasJobContext: !!payload.jobContext,
          pastAnswersCount: payload.pastAnswers?.length || 0
        } 
      })
      const result = await suggestFieldValue(config, payload)
      if (result.success) {
        logger.success('Field suggestion generated', { data: { suggestion: result.suggestion } })
      } else {
        logger.error('Field suggestion failed', result.error)
      }
      return result
    }

    case 'LLM_GENERATE_COVER_LETTER': {
      logger.info('Generating cover letter...')
      const payload = message.payload as GenerateCoverLetterPayload
      if (!payload.cvData || !payload.jobContext) {
        logger.warn('Missing CV data or job context')
        return { success: false, error: 'CV data and job context are required' }
      }
      const result = await generateCoverLetter(config, payload)
      if (result.success) {
        logger.success('Cover letter generated')
      } else {
        logger.error('Cover letter generation failed', result.error)
      }
      return result
    }

    case 'LLM_ANALYZE_CV': {
      logger.info('Analyzing CV...')
      const payload = message.payload as AnalyzeCVPayload
      if (!payload.cvText || !payload.jobContext) {
        logger.warn('Missing CV text or job context')
        return { success: false, error: 'CV text and job context are required' }
      }
      const result = await analyzeCV(config, payload)
      if (result.success) {
        logger.success('CV analysis complete')
      } else {
        logger.error('CV analysis failed', result.error)
      }
      return result
    }

    default:
      logger.error(`Unknown message type: ${message.type}`)
      return { success: false, error: `Unknown message type: ${message.type}` }
  }
}