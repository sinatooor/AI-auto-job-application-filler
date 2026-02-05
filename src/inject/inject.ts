import { RegisterInputs as workday } from './app/services/formFields/workday'
import { RegisterInputs as greenhouse } from './app/services/formFields/greenhouse'
import { RegisterInputs as greenhouseReact } from './app/services/formFields/greenhouseReact'

type InputSetup = (node: Node) => Promise<void>
const inputRegistrars: [string, InputSetup][] = [
  ['myworkdayjobs.com', workday],
  ['myworkdaysite.com', workday],
  ['job-boards.greenhouse.io', greenhouseReact],
  ['boards.greenhouse.io', greenhouse],
  ['boards.eu.greenhouse.io', greenhouse],
]
const getRegisterInput = (domain: string): InputSetup => {
  return inputRegistrars.find((site) => {
    return domain.endsWith(site[0])
  })[1]
}

const run = async () => {
  const RegisterInputs = getRegisterInput(window.location.host)
  const observer = new MutationObserver(async (_) => {
    RegisterInputs(document)
  })
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
  RegisterInputs(document)
}

/**
 * Prevent the injected script from running until the tab is revealed.
 * For example, when you open multiple tabs at once.
 */
if (!document.hidden) {
  run()
} else {
  const f = () => {
    run()
    document.removeEventListener('visibilitychange', f)
  }
  document.addEventListener('visibilitychange', f)
}

// Listen for activate event from popup
document.addEventListener('JAF_ACTIVATE', async () => {
  const RegisterInputs = getRegisterInput(window.location.host)
  if (RegisterInputs) {
    await RegisterInputs(document)
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
