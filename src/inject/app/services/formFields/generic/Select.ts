import fieldFillerQueue from '@src/shared/utils/fieldFillerQueue'
import { GenericBaseInput } from './GenericBaseInput'
import stringMatch from '@src/shared/utils/stringMatch'

/**
 * Handles generic select/dropdown fields on any website.
 */
export class Select extends GenericBaseInput<string> {
  // Directly target select elements
  static XPATH = ".//select[not(@job-app-filler)]"

  fieldType = 'Select'

  inputElement(): HTMLSelectElement | null {
    // The element IS the select element for generic inputs
    return this.element as HTMLSelectElement
  }

  public get fieldName(): string {
    const select = this.inputElement()
    
    // Try label first
    const labelEl = this.labelElement
    if (labelEl?.innerText) return labelEl.innerText.trim()
    
    // Try aria-label
    if (select?.getAttribute('aria-label')) return select.getAttribute('aria-label')!
    
    // Try title attribute
    if (select?.title) return select.title
    
    // Try name attribute
    if (select?.name) {
      return select.name
        .replace(/[_-]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .trim()
    }
    
    return 'Dropdown'
  }

  listenForChanges(): void {
    this.inputElement()?.addEventListener('change', () => {
      this.triggerReactUpdate()
    })
  }

  currentValue(): string {
    const select = this.inputElement()
    if (!select) return ''
    
    const selectedOption = select.options[select.selectedIndex]
    return selectedOption?.text || selectedOption?.value || ''
  }

  /**
   * Get all available options for this select
   */
  getOptions(): { value: string; text: string }[] {
    const select = this.inputElement()
    if (!select) return []
    
    return Array.from(select.options).map(option => ({
      value: option.value,
      text: option.text.trim()
    }))
  }

  async fill(): Promise<void> {
    const answers = await this.answer()
    const select = this.inputElement()
    if (!select || answers.length === 0) return

    const firstAnswer = answers[0].answer
    const options = this.getOptions()

    // Find best matching option
    let bestMatch: { value: string; text: string } | null = null

    for (const option of options) {
      // Try exact match first (case insensitive)
      if (stringMatch.exact(option.text, firstAnswer, { caseSensitive: false }) || 
          stringMatch.exact(option.value, firstAnswer, { caseSensitive: false })) {
        bestMatch = option
        break
      }
    }

    // If no exact match, try contains match
    if (!bestMatch) {
      for (const option of options) {
        if (stringMatch.contains(option.text.toLowerCase(), firstAnswer.toLowerCase()) ||
            stringMatch.contains(firstAnswer.toLowerCase(), option.text.toLowerCase())) {
          bestMatch = option
          break
        }
      }
    }

    if (bestMatch) {
      await fieldFillerQueue.enqueue(async () => {
        select.value = bestMatch!.value
        select.dispatchEvent(new Event('change', { bubbles: true }))
      })
    }
  }
}
