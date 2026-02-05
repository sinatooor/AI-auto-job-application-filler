import { RegisterInputs as workday } from './app/services/formFields/workday'
import { RegisterInputs as greenhouse } from './app/services/formFields/greenhouse'
import { RegisterInputs as greenhouseReact } from './app/services/formFields/greenhouseReact'
import { RegisterInputs as lever } from './app/services/formFields/lever'
import { injectLogger as logger } from '@src/shared/utils/logger'

logger.info('Inject script loaded', { data: { url: window.location.href, host: window.location.host } })

type InputSetup = (node: Node) => Promise<void>
const inputRegistrars: [string, InputSetup][] = [
  ['myworkdayjobs.com', workday],
  ['myworkdaysite.com', workday],
  ['job-boards.greenhouse.io', greenhouseReact],
  ['boards.greenhouse.io', greenhouse],
  ['boards.eu.greenhouse.io', greenhouse],
  ['jobs.lever.co', lever],
]

const getRegisterInput = (domain: string): InputSetup | null => {
  logger.debug('Looking for matching registrar', { data: { domain, availableRegistrars: inputRegistrars.map(r => r[0]) } })
  
  const registrar = inputRegistrars.find((site) => {
    return domain.endsWith(site[0])
  })
  
  if (registrar) {
    logger.success(`Found registrar for ${registrar[0]}`)
    return registrar[1]
  }
  
  logger.warn('No specific registrar found for this domain, using generic form detection')
  // Return a generic form field detector for any website
  return async (node: Node) => {
    logger.debug('Generic form field detection running', { data: { nodeType: node.nodeType } })
    // For now, just log that we're scanning
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element
      const inputs = element.querySelectorAll('input, textarea, select')
      if (inputs.length > 0) {
        logger.info(`Found ${inputs.length} form field(s)`, { 
          data: { 
            inputs: Array.from(inputs).map(i => ({
              type: i.getAttribute('type') || i.tagName.toLowerCase(),
              name: i.getAttribute('name'),
              id: i.getAttribute('id')
            }))
          } 
        })
      }
    }
  }
}

const run = async () => {
  logger.info('🚀 Starting form field registration...')
  logger.time('Form field registration')
  
  const RegisterInputs = getRegisterInput(window.location.host)
  
  if (!RegisterInputs) {
    logger.error('Failed to get input registrar - this should not happen')
    return
  }
  
  logger.info('Setting up MutationObserver for dynamic content...')
  let mutationCount = 0
  const observer = new MutationObserver(async (mutations) => {
    mutationCount++
    logger.debug(`DOM mutation detected (#${mutationCount})`, { 
      data: { 
        mutationCount: mutations.length,
        addedNodes: mutations.reduce((sum, m) => sum + m.addedNodes.length, 0),
        removedNodes: mutations.reduce((sum, m) => sum + m.removedNodes.length, 0)
      } 
    })
    
    try {
      await RegisterInputs(document)
      logger.debug('Form fields re-registered after mutation')
    } catch (error) {
      logger.error('Error during mutation observer registration', error)
    }
  })
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
  logger.success('MutationObserver active - watching for dynamic form changes')
  
  logger.info('Scanning initial page for form fields...')
  try {
    await RegisterInputs(document)
    logger.success('Initial form field registration complete')
  } catch (error) {
    logger.error('Error during initial form registration', error)
  }
  
  logger.timeEnd('Form field registration')
  logger.success('✨ JobAppFiller inject script ready!')
}

/**
 * Prevent the injected script from running until the tab is revealed.
 * For example, when you open multiple tabs at once.
 */
if (!document.hidden) {
  logger.info('Document is visible, running immediately')
  run()
} else {
  logger.info('Document is hidden, waiting for visibility...')
  const f = () => {
    logger.info('Document became visible, running now')
    run()
    document.removeEventListener('visibilitychange', f)
  }
  document.addEventListener('visibilitychange', f)
}
