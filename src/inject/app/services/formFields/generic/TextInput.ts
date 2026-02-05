import fieldFillerQueue from '@src/shared/utils/fieldFillerQueue'
import { GenericBaseInput } from './GenericBaseInput'

/**
 * Handles generic text input fields on any website.
 * Matches input elements with types: text, email, tel, url, search, number, or no type specified.
 */
export class TextInput extends GenericBaseInput<string> {
  // Directly target input elements (not hidden, not password, not checkbox/radio/button types)
  static XPATH = [
    ".//input[",
    "  (not(@type) or @type='text' or @type='email' or @type='tel' or @type='url' or @type='search' or @type='number')",
    "  and not(@type='hidden')",
    "  and not(@type='password')",
    "  and not(@type='checkbox')",
    "  and not(@type='radio')",
    "  and not(@type='submit')",
    "  and not(@type='button')",
    "  and not(@type='file')",
    "  and not(@type='image')",
    "  and not(@type='reset')",
    "]",
    "[not(@job-app-filler)]",
  ].join('')

  fieldType = 'TextInput'

  inputElement(): HTMLInputElement | null {
    // The element IS the input element for generic inputs
    return this.element as HTMLInputElement
  }

  public get fieldName(): string {
    const input = this.inputElement()
    
    // Try label first
    const labelEl = this.labelElement
    if (labelEl?.innerText) return labelEl.innerText.trim()
    
    // Try placeholder
    if (input?.placeholder) return input.placeholder
    
    // Try aria-label
    if (input?.getAttribute('aria-label')) return input.getAttribute('aria-label')!
    
    // Try title attribute
    if (input?.title) return input.title
    
    // Try name attribute (clean it up)
    if (input?.name) {
      return input.name
        .replace(/[_-]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .trim()
    }
    
    // Try id attribute
    if (input?.id) {
      return input.id
        .replace(/[_-]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .trim()
    }
    
    return 'Text Field'
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
