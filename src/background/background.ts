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

// Handle messages from content scripts and popup/options
chrome.runtime.onMessage.addListener(
  (
    message: LLMMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: LLMResponse) => void
  ) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((error) => {
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
  const settings = await getLLMSettings()

  if (!settings.apiKey && message.type !== 'LLM_TEST_CONNECTION') {
    return { success: false, error: 'API key not configured. Please set up your LLM provider in settings.' }
  }

  const config = {
    provider: settings.provider,
    apiKey: settings.apiKey,
    model: settings.model,
  }

  switch (message.type) {
    case 'LLM_TEST_CONNECTION': {
      // Allow passing custom config for testing
      const testConfig = message.payload?.apiKey ? {
        provider: message.payload.provider || settings.provider,
        apiKey: message.payload.apiKey,
        model: message.payload.model || settings.model,
      } : config

      const result = await testConnection(testConfig)
      return {
        success: result.success,
        message: result.success ? 'Connection successful!' : result.error,
      }
    }

    case 'LLM_PROCESS_CV': {
      const payload = message.payload as LLMProcessCVPayload
      if (!payload.text && !payload.file) {
        return { success: false, error: 'No CV text or file provided' }
      }
      return processCV(config, payload.text, payload.file)
    }

    case 'LLM_SUGGEST_FIELD': {
      const payload = message.payload as LLMSuggestFieldPayload
      return suggestFieldValue(config, payload)
    }

    case 'LLM_GENERATE_COVER_LETTER': {
      const payload = message.payload as GenerateCoverLetterPayload
      if (!payload.cvData || !payload.jobContext) {
        return { success: false, error: 'CV data and job context are required' }
      }
      return generateCoverLetter(config, payload)
    }

    case 'LLM_ANALYZE_CV': {
      const payload = message.payload as AnalyzeCVPayload
      if (!payload.cvText || !payload.jobContext) {
        return { success: false, error: 'CV text and job context are required' }
      }
      return analyzeCV(config, payload)
    }

    default:
      return { success: false, error: `Unknown message type: ${message.type}` }
  }
}

// Log when background script is loaded
console.log('JobAppFiller background script loaded')