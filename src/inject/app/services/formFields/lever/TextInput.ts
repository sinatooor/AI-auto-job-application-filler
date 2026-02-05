import fieldFillerQueue from "@src/shared/utils/fieldFillerQueue";
import { getElement } from "@src/shared/utils/getElements";
import { LeverBaseInput } from "./LeverBaseInput";
import { xpaths } from './xpaths'

export class TextInput extends LeverBaseInput<any> {
    // Lever fields are often wrapped in divs. 
    // We'll target the label or the input wrapper.
    // For simplicity, let's try to find inputs that have labels.
    static XPATH = "//*[@class='application-question']"
    fieldType = 'TextInput'

    inputElement(): HTMLInputElement {
        return getElement(this.element, ".//input[@type='text']") as HTMLInputElement
    }

    listenForChanges(): void {
        this.inputElement()?.addEventListener("input", () => {
            this.triggerReactUpdate()
        })
    }

    currentValue() {
        return this.inputElement()?.value
    }

    async fill(): Promise<void> {
        const answers = await this.answer()
        if (this.inputElement() && answers.length > 0) {
            const firstAnswer = answers[0]
            await fieldFillerQueue.enqueue(async () => {
                this.inputElement().value = firstAnswer.answer
                this.inputElement().dispatchEvent(new Event('input', { bubbles: true }))
                this.inputElement().dispatchEvent(new Event('change', { bubbles: true }))
            })
        }
    }

    // Override autoDiscover to be specific if needed, 
    // but BaseFormInput's autoDiscover should work if XPATH is correct
}
