import fieldFillerQueue from '@src/shared/utils/fieldFillerQueue'
import { GenericBaseInput } from './GenericBaseInput'

/**
 * Handles generic checkbox fields on any website.
 */
export class Checkbox extends GenericBaseInput<boolean> {
  // Directly target checkbox input elements
  static XPATH = ".//input[@type='checkbox'][not(@job-app-filler)]"

  fieldType = 'Checkbox'

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
    
    // Try title attribute
    if (input?.title) return input.title
    
    // Try value attribute for checkboxes
    if (input?.value && input.value !== 'on') return input.value
    
    // Try name attribute
    if (input?.name) {
      return input.name
        .replace(/[_-]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .trim()
    }
    
    return 'Checkbox'
  }

  listenForChanges(): void {
    this.inputElement()?.addEventListener('change', () => {
      this.triggerReactUpdate()
    })
  }

  currentValue(): boolean {
    return this.inputElement()?.checked || false
  }

  async fill(): Promise<void> {
    const answers = await this.answer()
    const input = this.inputElement()
    if (input && answers.length > 0) {
      const firstAnswer = answers[0].answer
      await fieldFillerQueue.enqueue(async () => {
        // Handle various truthy values
        const shouldCheck = firstAnswer === true || 
                           firstAnswer === 'true' || 
                           firstAnswer === 'yes' || 
                           firstAnswer === '1' ||
                           firstAnswer === 'checked'
        
        if (input.checked !== shouldCheck) {
          input.checked = shouldCheck
          input.dispatchEvent(new Event('change', { bubbles: true }))
          input.dispatchEvent(new Event('input', { bubbles: true }))
        }
      })
    }
  }
}
