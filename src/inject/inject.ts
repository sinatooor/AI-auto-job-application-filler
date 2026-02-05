import { RegisterInputs as workday } from './app/services/formFields/workday'
import { RegisterInputs as greenhouse } from './app/services/formFields/greenhouse'
import { RegisterInputs as greenhouseReact } from './app/services/formFields/greenhouseReact'
import { RegisterInputs as generic } from './app/services/formFields/generic'

type InputSetup = (node: Node) => Promise<void>
const inputRegistrars: [string, InputSetup][] = [
  ['myworkdayjobs.com', workday],
  ['myworkdaysite.com', workday],
  ['job-boards.greenhouse.io', greenhouseReact],
  ['boards.greenhouse.io', greenhouse],
  ['boards.eu.greenhouse.io', greenhouse],
]

const getRegisterInput = (domain: string): InputSetup => {
  const match = inputRegistrars.find((site) => {
    return domain.endsWith(site[0])
  })
  // Return the specific handler if found, otherwise use the generic handler
  return match ? match[1] : generic
}

// Track global activation state
let isGloballyActivated = false
let observer: MutationObserver | null = null

// Show all JAF widgets
function showWidgets() {
  document.querySelectorAll('.jaf-widget').forEach((el) => {
    (el as HTMLElement).style.display = 'inline-block'
  })
}

// Hide all JAF widgets
function hideWidgets() {
  document.querySelectorAll('.jaf-widget').forEach((el) => {
    (el as HTMLElement).style.display = 'none'
  })
}

const run = async () => {
  const RegisterInputs = getRegisterInput(window.location.host)
  
  // Only register inputs if globally activated
  if (!isGloballyActivated) {
    return
  }
  
  observer = new MutationObserver(async (_) => {
    if (isGloballyActivated) {
      RegisterInputs(document)
    }
  })
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
  RegisterInputs(document)
}

// Check initial activation state from storage
const checkActivationAndRun = async () => {
  try {
    // Request activation state from content script
    const event = new CustomEvent('JAF_GET_ACTIVATION_STATE')
    document.dispatchEvent(event)
  } catch (e) {
    // Fallback: assume not activated
  }
}

// Listen for activation state response from content script
document.addEventListener('JAF_ACTIVATION_STATE', ((e: CustomEvent) => {
  isGloballyActivated = e.detail.activated
  if (isGloballyActivated) {
    run()
    showWidgets()
  } else {
    hideWidgets()
  }
}) as EventListener)

/**
 * Prevent the injected script from running until the tab is revealed.
 * For example, when you open multiple tabs at once.
 */
if (!document.hidden) {
  checkActivationAndRun()
} else {
  const f = () => {
    checkActivationAndRun()
    document.removeEventListener('visibilitychange', f)
  }
  document.addEventListener('visibilitychange', f)
}

// Listen for activate event from popup
document.addEventListener('JAF_ACTIVATE', async () => {
  isGloballyActivated = true
  const RegisterInputs = getRegisterInput(window.location.host)
  await RegisterInputs(document)
  showWidgets()
})

// Listen for deactivate event
document.addEventListener('JAF_DEACTIVATE', () => {
  isGloballyActivated = false
  hideWidgets()
  if (observer) {
    observer.disconnect()
    observer = null
  }
})

// Listen for auto-fill with AI event from popup
document.addEventListener('JAF_AUTO_FILL_AI', async () => {
  let filledCount = 0
  
  // Find all JAF field widgets on the page and trigger their AI buttons
  const jafWidgets = document.querySelectorAll('[data-jaf-field]')
  
  // Dispatch AI fill event to each field
  const aiEvent = new CustomEvent('JAF_TRIGGER_AI_FILL')
  jafWidgets.forEach((widget) => {
    widget.dispatchEvent(aiEvent)
    filledCount++
  })
  
  // Send result back
  document.dispatchEvent(new CustomEvent('JAF_AUTO_FILL_AI_RESULT', {
    detail: { success: true, filledCount }
  }))
})
