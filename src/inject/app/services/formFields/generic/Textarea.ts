import fieldFillerQueue from '@src/shared/utils/fieldFillerQueue'
import { getElement } from '@src/shared/utils/getElements'
import { GenericBaseInput } from './GenericBaseInput'

/**
 * Handles generic textarea fields on any website.
 */
export class Textarea extends GenericBaseInput<string> {
  static XPATH = [
    ".//div[.//textarea]",
    "[.//label or ./preceding-sibling::label or ./following-sibling::label or .//textarea[@placeholder]]",
    "[not(ancestor::*[@job-app-filler])]",
  ].join('')

  fieldType = 'Textarea'

  inputElement(): HTMLTextAreaElement | null {
    return getElement(this.element, './/textarea') as HTMLTextAreaElement | null
  }

  public get fieldName(): string {
    const textarea = this.inputElement()
    
    // Try label first
    const labelText = super.fieldName
    if (labelText) return labelText.trim()
    
    // Try placeholder
    if (textarea?.placeholder) return textarea.placeholder
    
    // Try aria-label
    if (textarea?.getAttribute('aria-label')) return textarea.getAttribute('aria-label')!
    
    // Try name attribute
    if (textarea?.name) return textarea.name
    
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
