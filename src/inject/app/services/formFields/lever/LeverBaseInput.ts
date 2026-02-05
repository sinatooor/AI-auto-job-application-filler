import { BaseFormInput } from '../baseFormInput'
import React from 'react'
import { createRoot } from 'react-dom/client'

export abstract class LeverBaseInput<AnswerType> extends BaseFormInput<AnswerType> {
    attachReactApp(app: React.ReactNode, inputContainer: HTMLElement): void {
        const rootEl = document.createElement('div')
        inputContainer.appendChild(rootEl)
        inputContainer.style.position = 'relative'

        // Leverage React 18 createRoot
        const root = createRoot(rootEl)
        root.render(app)
    }
}
