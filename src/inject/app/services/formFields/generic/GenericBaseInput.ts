import { createRoot } from 'react-dom/client'
import { BaseFormInput, isRegistered, isVisible } from '../baseFormInput'
import { getElement, getElements } from '@src/shared/utils/getElements'

export abstract class GenericBaseInput<
  AnswerType
> extends BaseFormInput<AnswerType> {
  abstract inputElement(): HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null

  static async autoDiscover(node: Node = document) {
    const elements = getElements(node, this.XPATH)
    elements.forEach((el) => {
      if (isRegistered(el) || !isVisible(el)) {
        return
      }
      // @ts-ignore
      new this(el)
    })
  }

  /**
   * The element to insert the widget before
   */
  inputDisplayElement(): HTMLElement | null {
    return this.inputElement()
  }

  /**
   * Try to find a section by looking for common section patterns
   */
  sectionElement(): HTMLElement | null {
    // Look for common section patterns: fieldset, form sections, etc.
    return getElement(
      this.element,
      `ancestor::fieldset | ancestor::section | ancestor::div[contains(@class, 'section') or contains(@class, 'group')]`
    )
  }

  get section(): string {
    const sectionEl = this.sectionElement()
    if (!sectionEl) return ''
    
    // Try to find a legend or heading in the section
    const legend = getElement(sectionEl, './/legend | .//h1 | .//h2 | .//h3 | .//h4 | .//h5 | .//h6')
    return legend?.innerText?.trim() || ''
  }

  public get page(): string {
    // Try to get page title from various common elements
    const pageTitle = getElement(document, './/h1 | .//title')
    return pageTitle?.innerText?.trim() || document.title || ''
  }

  /**
   * Attach widget before the input element
   */
  attachReactApp(app: React.ReactNode, inputContainer: HTMLElement) {
    const rootElement = document.createElement('div')
    rootElement.classList.add('jaf-widget')
    rootElement.setAttribute('data-jaf-field', 'true')
    
    const displayEl = this.inputDisplayElement()
    if (displayEl && displayEl.parentElement) {
      displayEl.parentElement.insertBefore(rootElement, displayEl)
      createRoot(rootElement).render(app)
    }
  }
}
