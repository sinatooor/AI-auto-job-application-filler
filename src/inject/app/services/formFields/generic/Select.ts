import fieldFillerQueue from '@src/shared/utils/fieldFillerQueue'
import { getElement } from '@src/shared/utils/getElements'
import { GenericBaseInput } from './GenericBaseInput'
import stringMatch from '@src/shared/utils/stringMatch'

/**
 * Handles generic select/dropdown fields on any website.
 */
export class Select extends GenericBaseInput<string> {
  static XPATH = [
    ".//div[.//select]",
    "[.//label or ./preceding-sibling::label or ./following-sibling::label]",
    "[not(ancestor::*[@job-app-filler])]",
  ].join('')

  fieldType = 'Select'

  inputElement(): HTMLSelectElement | null {
    return getElement(this.element, './/select') as HTMLSelectElement | null
  }

  public get fieldName(): string {
    const select = this.inputElement()
    
    // Try label first
    const labelText = super.fieldName
    if (labelText) return labelText.trim()
    
    // Try aria-label
    if (select?.getAttribute('aria-label')) return select.getAttribute('aria-label')!
    
    // Try name attribute
    if (select?.name) return select.name
    
    return 'Unknown Field'
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
