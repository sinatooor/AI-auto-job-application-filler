import fieldFillerQueue from '@src/shared/utils/fieldFillerQueue'
import { getElement } from '@src/shared/utils/getElements'
import { GenericBaseInput } from './GenericBaseInput'

/**
 * Handles generic text input fields on any website.
 * Matches input elements with types: text, email, tel, url, search, or no type specified.
 */
export class TextInput extends GenericBaseInput<string> {
  // Match common form field wrapper patterns
  static XPATH = [
    ".//div[",
    "  .//input[not(@type) or @type='text' or @type='email' or @type='tel' or @type='url' or @type='search' or @type='number']",
    "  and not(.//input[@type='hidden'])",
    "]",
    "[.//label or ./preceding-sibling::label or ./following-sibling::label or .//input[@placeholder]]",
    "[not(ancestor::*[@job-app-filler])]",
  ].join('')

  fieldType = 'TextInput'

  inputElement(): HTMLInputElement | null {
    return getElement(
      this.element,
      ".//input[not(@type) or @type='text' or @type='email' or @type='tel' or @type='url' or @type='search' or @type='number']"
    ) as HTMLInputElement | null
  }

  public get fieldName(): string {
    // Try various ways to find the field name
    const input = this.inputElement()
    
    // Try label first
    const labelText = super.fieldName
    if (labelText) return labelText.trim()
    
    // Try placeholder
    if (input?.placeholder) return input.placeholder
    
    // Try aria-label
    if (input?.getAttribute('aria-label')) return input.getAttribute('aria-label')!
    
    // Try name attribute
    if (input?.name) return input.name
    
    return 'Unknown Field'
  }

  listenForChanges(): void {
    this.inputElement()?.addEventListener('input', () => {
      this.triggerReactUpdate()
    })
  }

  currentValue(): string {
    return this.inputElement()?.value || ''
  }

  async fill(): Promise<void> {
    const answers = await this.answer()
    const input = this.inputElement()
    if (input && answers.length > 0) {
      const firstAnswer = answers[0]
      await fieldFillerQueue.enqueue(async () => {
        input.value = firstAnswer.answer
        input.dispatchEvent(new InputEvent('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      })
    }
  }
}
