import fieldFillerQueue from '@src/shared/utils/fieldFillerQueue'
import { GenericBaseInput } from './GenericBaseInput'

/**
 * Handles generic textarea fields on any website.
 */
export class Textarea extends GenericBaseInput<string> {
  // Directly target textarea elements
  static XPATH = ".//textarea[not(@job-app-filler)]"

  fieldType = 'Textarea'

  inputElement(): HTMLTextAreaElement | null {
    // The element IS the textarea element for generic inputs
    return this.element as HTMLTextAreaElement
  }

  public get fieldName(): string {
    const textarea = this.inputElement()
    
    // Try label first
    const labelEl = this.labelElement
    if (labelEl?.innerText) return labelEl.innerText.trim()
    
    // Try placeholder
    if (textarea?.placeholder) return textarea.placeholder
    
    // Try aria-label
    if (textarea?.getAttribute('aria-label')) return textarea.getAttribute('aria-label')!
    
    // Try title attribute
    if (textarea?.title) return textarea.title
    
    // Try name attribute
    if (textarea?.name) {
      return textarea.name
        .replace(/[_-]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .trim()
    }
    
    return 'Text Area'
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
    const textarea = this.inputElement()
    if (textarea && answers.length > 0) {
      const firstAnswer = answers[0]
      await fieldFillerQueue.enqueue(async () => {
        textarea.value = firstAnswer.answer
        textarea.dispatchEvent(new InputEvent('input', { bubbles: true }))
        textarea.dispatchEvent(new Event('change', { bubbles: true }))
      })
    }
  }
}
