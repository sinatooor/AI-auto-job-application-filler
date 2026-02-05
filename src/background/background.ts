import { getLLMSettings, getCVData, getActiveJobContext } from '@src/contentScript/utils/storage/LLMSettingsStore'
import {
  AnalyzeCVPayload,
  GenerateCoverLetterPayload,
  LLMMessage,
  LLMProcessCVPayload,
  LLMResponse,
  LLMSuggestFieldPayload,
} from '@src/contentScript/utils/storage/LLMTypes'
import { analyzeCV, generateCoverLetter, processCV, suggestFieldValue, testConnection, fillPageWithAI } from './services/llmClient'

// Create context menu on extension installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'jaf-register-field',
    title: 'Add to Job App Filler',
    contexts: ['editable', 'page'],
  })
  
  chrome.contextMenus.create({
    id: 'jaf-ai-fill-page',
    title: 'AI Fill All Fields',
    contexts: ['page'],
  })
})

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return
  
  if (info.menuItemId === 'jaf-register-field') {
    // Send message to content script to register the clicked element
    await chrome.tabs.sendMessage(tab.id, { type: 'REGISTER_CLICKED_ELEMENT' })
  } else if (info.menuItemId === 'jaf-ai-fill-page') {
    // Trigger AI fill for the entire page
    await chrome.tabs.sendMessage(tab.id, { type: 'AI_FILL_PAGE' })
  }
})

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
      if (!payload.cvText && !payload.cvFile) {
        return { success: false, error: 'CV text or file is required' }
      }
      return analyzeCV(config, payload)
    }

    case 'LLM_AI_FILL_PAGE': {
      // Get CV data and job context for AI fill
      const cvData = await getCVData()
      const jobContext = await getActiveJobContext()
      
      const payload = message.payload as { pageFields: Array<{ selector: string; label: string; type: string; currentValue: string; tagName: string; options?: string[] }> }
      return fillPageWithAI(config, {
        pageFields: payload.pageFields,
        cvData: cvData.extractedData,
        jobContext,
      })
    }

    default:
      return { success: false, error: `Unknown message type: ${message.type}` }
  }
}

// Log when background script is loaded
console.log('JobAppFiller background script loaded')