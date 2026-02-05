import fieldFillerQueue from '@src/shared/utils/fieldFillerQueue'
import { GenericBaseInput } from './GenericBaseInput'
import stringMatch from '@src/shared/utils/stringMatch'

/**
 * Handles generic radio button fields on any website.
 * Groups radio buttons by name attribute.
 */
export class Radio extends GenericBaseInput<string> {
  // Directly target radio input elements
  static XPATH = ".//input[@type='radio'][not(@job-app-filler)]"

  fieldType = 'Radio'

  inputElement(): HTMLInputElement | null {
    return this.element as HTMLInputElement
  }

  public get fieldName(): string {
    const input = this.inputElement()
    
    // Try label first
    const labelEl = this.labelElement
    if (labelEl?.innerText) return labelEl.innerText.trim()
    
    // Try aria-label
    if (input?.getAttribute('aria-label')) return input.getAttribute('aria-label')!
    
    // Try value attribute
    if (input?.value) return input.value
    
    // Try name attribute
    if (input?.name) {
      return input.name
        .replace(/[_-]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .trim()
    }
    
    return 'Radio Option'
  }

  listenForChanges(): void {
    this.inputElement()?.addEventListener('change', () => {
      this.triggerReactUpdate()
    })
  }

  currentValue(): string {
    const input = this.inputElement()
    return input?.checked ? (input.value || 'checked') : ''
  }

  async fill(): Promise<void> {
    const answers = await this.answer()
    const input = this.inputElement()
    if (input && answers.length > 0) {
      const firstAnswer = answers[0].answer
      
      // Check if this radio's value matches the saved answer
      const matches = stringMatch.exact(input.value, firstAnswer, { caseSensitive: false }) ||
                     stringMatch.contains(input.value.toLowerCase(), firstAnswer.toLowerCase()) ||
                     stringMatch.contains(firstAnswer.toLowerCase(), input.value.toLowerCase())
      
      if (matches && !input.checked) {
        await fieldFillerQueue.enqueue(async () => {
          input.checked = true
          input.dispatchEvent(new Event('change', { bubbles: true }))
          input.dispatchEvent(new Event('input', { bubbles: true }))
        })
      }
    }
  }
}
