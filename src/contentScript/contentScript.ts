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
  getLLMSettings,
  getGlobalActivation,
  getAutoFillOnLoad 
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

server.register('getProbableAnswers', async (fieldPath: FieldPath) => {
  return answers1010
    .searchProbable(fieldPath.fieldName)
    .map((record) => convert1010To106(record))
})

server.register('getAutoFillOnLoad', async () => {
  return getAutoFillOnLoad()
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

// Track the last right-clicked element for manual registration
let lastRightClickedElement: HTMLElement | null = null
document.addEventListener('contextmenu', (e) => {
  lastRightClickedElement = e.target as HTMLElement
})

// Helper to generate a unique CSS selector for an element
function generateSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${element.id}`
  }
  
  const name = element.getAttribute('name')
  if (name) {
    return `${element.tagName.toLowerCase()}[name="${name}"]`
  }
  
  // Try to build a path using classes
  const path: string[] = []
  let current: HTMLElement | null = element
  
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase()
    
    if (current.id) {
      selector = `#${current.id}`
      path.unshift(selector)
      break
    }
    
    if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/).filter(c => c).slice(0, 2)
      if (classes.length > 0) {
        selector += '.' + classes.join('.')
      }
    }
    
    // Add nth-child if needed
    const parent = current.parentElement
    if (parent) {
      const siblings = Array.from(parent.children).filter(c => c.tagName === current!.tagName)
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1
        selector += `:nth-of-type(${index})`
      }
    }
    
    path.unshift(selector)
    current = current.parentElement
  }
  
  return path.join(' > ')
}

// Helper to find the label for a form field
function findLabel(element: HTMLElement): string {
  // Check for associated label
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`)
    if (label) return label.textContent?.trim() || ''
  }
  
  // Check for wrapping label
  const parentLabel = element.closest('label')
  if (parentLabel) {
    return parentLabel.textContent?.trim() || ''
  }
  
  // Check for aria-label
  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel) return ariaLabel
  
  // Check for placeholder
  const placeholder = element.getAttribute('placeholder')
  if (placeholder) return placeholder
  
  // Check for name attribute
  const name = element.getAttribute('name')
  if (name) return name.replace(/[_-]/g, ' ')
  
  // Check for preceding text
  const prev = element.previousElementSibling
  if (prev && prev.textContent) {
    return prev.textContent.trim().slice(0, 50)
  }
  
  return ''
}

// Helper to scan page for all form fields
function scanPageForFields(): Array<{selector: string; label: string; type: string; currentValue: string; tagName: string; options?: string[]}> {
  const fields: Array<{selector: string; label: string; type: string; currentValue: string; tagName: string; options?: string[]}> = []
  
  // Find all inputs
  document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])').forEach((el) => {
    const input = el as HTMLInputElement
    const selector = generateSelector(input)
    const type = input.type || 'text'
    
    fields.push({
      selector,
      label: findLabel(input),
      type,
      currentValue: input.value,
      tagName: 'INPUT'
    })
  })
  
  // Find all textareas
  document.querySelectorAll('textarea').forEach((el) => {
    const textarea = el as HTMLTextAreaElement
    fields.push({
      selector: generateSelector(textarea),
      label: findLabel(textarea),
      type: 'textarea',
      currentValue: textarea.value,
      tagName: 'TEXTAREA'
    })
  })
  
  // Find all selects
  document.querySelectorAll('select').forEach((el) => {
    const select = el as HTMLSelectElement
    const options = Array.from(select.options).map(o => o.text)
    fields.push({
      selector: generateSelector(select),
      label: findLabel(select),
      type: 'select',
      currentValue: select.value,
      tagName: 'SELECT',
      options
    })
  })
  
  return fields
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SHOW_WHATS_NEW') {
    document.dispatchEvent(new CustomEvent(EVENT_LISTENER_ID))
  }
  
  if (message.type === 'ACTIVATE_EXTENSION') {
    // Dispatch event to trigger re-detection of form fields
    document.dispatchEvent(new CustomEvent('JAF_ACTIVATE'))
    sendResponse({ success: true })
    return true
  }
  
  if (message.type === 'REGISTER_CLICKED_ELEMENT') {
    // Handle manual field registration via right-click
    if (!lastRightClickedElement) {
      sendResponse({ success: false, error: 'No element was right-clicked' })
      return true
    }
    
    // Find the actual form input if user clicked on a label or wrapper
    let targetElement = lastRightClickedElement
    const isFormElement = ['INPUT', 'TEXTAREA', 'SELECT'].includes(targetElement.tagName)
    
    if (!isFormElement) {
      // Try to find a form element inside
      const innerInput = targetElement.querySelector('input, textarea, select') as HTMLElement
      if (innerInput) {
        targetElement = innerInput
      }
    }
    
    const selector = generateSelector(targetElement)
    const label = findLabel(targetElement)
    
    // Dispatch event to inject script to register this field
    document.dispatchEvent(new CustomEvent('JAF_REGISTER_MANUAL_FIELD', {
      detail: { selector, label, element: targetElement }
    }))
    
    sendResponse({ success: true, selector, label })
    return true
  }
  
  if (message.type === 'AI_FILL_PAGE') {
    // Scan page for all form fields and use AI to fill them
    (async () => {
      try {
        const pageFields = scanPageForFields()
        
        if (pageFields.length === 0) {
          sendResponse({ success: false, error: 'No form fields found on this page' })
          return
        }
        
        // Get CV data and job context
        const cvData = await getCVData()
        const jobContext = await getActiveJobContext()
        
        // Send to background script for AI processing
        const result = await chrome.runtime.sendMessage({
          type: 'LLM_AI_FILL_PAGE',
          payload: {
            pageFields,
            cvData: cvData.extractedData,
            jobContext
          }
        })
        
        if (!result.success) {
          sendResponse({ success: false, error: result.error })
          return
        }
        
        // Apply the filled values
        let filledCount = 0
        for (const field of result.data.filledFields) {
          try {
            const element = document.querySelector(field.selector) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
            if (element && field.value) {
              element.value = field.value
              element.dispatchEvent(new Event('input', { bubbles: true }))
              element.dispatchEvent(new Event('change', { bubbles: true }))
              filledCount++
            }
          } catch (e) {
            console.warn('Failed to fill field:', field.selector, e)
          }
        }
        
        sendResponse({ success: true, filledCount, totalFields: pageFields.length })
      } catch (error) {
        sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })()
    
    return true // Keep channel open for async response
  }
  
  if (message.type === 'AUTO_FILL_WITH_AI') {
    // Dispatch event to trigger AI auto-fill on all fields
    const event = new CustomEvent('JAF_AUTO_FILL_AI')
    document.dispatchEvent(event)
    
    // Listen for the result
    const handleResult = (e: CustomEvent) => {
      document.removeEventListener('JAF_AUTO_FILL_AI_RESULT', handleResult as EventListener)
      sendResponse(e.detail)
    }
    document.addEventListener('JAF_AUTO_FILL_AI_RESULT', handleResult as EventListener)
    
    // Timeout fallback
    setTimeout(() => {
      document.removeEventListener('JAF_AUTO_FILL_AI_RESULT', handleResult as EventListener)
      sendResponse({ success: true, message: 'AI auto-fill triggered' })
    }, 30000)
    
    return true // Keep channel open for async response
  }
})

const run = async () => {
  await answers1010.load()
  await migrate1010()
  await migrateEducation()
  injectScript('inject.js')
  loadApp()
  
  // Listen for activation state requests from inject script
  document.addEventListener('JAF_GET_ACTIVATION_STATE', async () => {
    const isGloballyActivated = await getGlobalActivation()
    document.dispatchEvent(new CustomEvent('JAF_ACTIVATION_STATE', {
      detail: { activated: isGloballyActivated }
    }))
  })
  
  // Check if global activation is enabled and auto-activate
  const isGloballyActivated = await getGlobalActivation()
  if (isGloballyActivated) {
    // Small delay to ensure inject script is loaded
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('JAF_ACTIVATE'))
    }, 500)
  }
}

// Listen for changes to the global activation state
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.global_activation) {
    if (changes.global_activation.newValue === true) {
      // Activation was turned on - trigger form field detection
      document.dispatchEvent(new CustomEvent('JAF_ACTIVATE'))
    } else {
      // Activation was turned off - hide widgets
      document.dispatchEvent(new CustomEvent('JAF_DEACTIVATE'))
    }
  }
})

run()
