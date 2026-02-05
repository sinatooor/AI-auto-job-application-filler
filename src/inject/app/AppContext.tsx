import React, {
  createContext,
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'
import { BaseFormInput } from './services/formFields/baseFormInput'
import { EditableAnswerState } from './hooks/useEditableAnswerState'
import { PopperState, usePopperState } from './hooks/usePopperState'
import { contentScriptAPI } from './services/contentScriptApi'

export type FillButtonState = {
  isDisabled: boolean
  onClick: () => Promise<void>
  isFilled: boolean
}

export type SaveButtonState = {
  showSuccessBadge: boolean
  clickHandler: () => void
}

export type AIAnswerState = {
  isEnabled: boolean
  onClick: () => Promise<void>
}

export type LocalAnswer = [string, Boolean]

export interface AppContextType {
  backend: BaseFormInput<any>
  refresh: () => Promise<void>
  init: () => Promise<void>
  fillButton: FillButtonState
  saveButton: SaveButtonState
  aiAnswer: AIAnswerState
  deleteAnswer: (id: number) => Promise<void>
  currentValue: any
  setCurrentValue: (_: any) => void
  isFilled: boolean
  editableAnswer: LocalAnswer[]
  setEditableAnswer: Dispatch<SetStateAction<LocalAnswer[]>>
  editableAnswerState: EditableAnswerState
  moreInfoPopper: PopperState

  fieldNotice: string | null
}

const AppContext = createContext<AppContextType>(null)

export const useAppContext = () => useContext(AppContext)

export const ContextProvider: FC<{
  children: ReactNode
  backend: BaseFormInput<any>
}> = ({ children, backend }) => {
  const [currentValue, setCurrentValue] = useState<any>(null)
  const [fillButtonDisabled, setFillButtonDisabled] = useState<boolean>(false)
  const [editableAnswer, setEditableAnswer] = useState<LocalAnswer[]>([])
  const [aiEnabled, setAiEnabled] = useState<boolean>(false)
  const editableAnswerState: EditableAnswerState =
    backend.editableAnswerHook(backend)
  const fieldNotice = backend.fieldNotice
  useEffect(() => {
    ;(async () => {
      await editableAnswerState.init()
      await editableAnswerState.initProbable()
      await refresh()
      await handleFill()
      // Check if AI is enabled
      try {
        const llmSettings = await contentScriptAPI.send('getLLMSettings')
        if (llmSettings.ok && llmSettings.data?.apiKey) {
          setAiEnabled(true)
        }
      } catch (e) {
        console.error('Failed to get LLM settings:', e)
      }
    })()
    backend.element.addEventListener(backend.reactMessageEventId, refresh)
    return () => {
      backend.element.removeEventListener(backend.reactMessageEventId, refresh)
    }
  }, [])

  const init = async () => {
    await editableAnswerState.init()
    await editableAnswerState.initProbable()
    await refresh()
  }

  const refresh = async () => {
    setCurrentValue(backend.currentValue())
  }

  const isFilled =
    editableAnswerState.answers.length > 0 &&
    backend.isFilled(
      backend.currentValue(),
      backend.answerValue.prepForFill(editableAnswerState.answers)
    )

  const deleteAnswer: AppContextType['deleteAnswer'] = async (id: number) => {
    await backend.deleteAnswer(id)
    await refresh()
  }

  const handleFill = async () => {
    setFillButtonDisabled(true)
    try {
      // Check if we should use AI auto-fill
      const llmSettings = await contentScriptAPI.send('getLLMSettings')
      
      if (llmSettings.ok && llmSettings.data?.autoFillEnabled && llmSettings.data?.apiKey) {
        // Check answer confidence
        const confidenceResult = await contentScriptAPI.send('getAnswerConfidence', backend.path)
        
        if (confidenceResult.ok) {
          const { hasAnswer, confidence } = confidenceResult.data || {}
          const threshold = llmSettings.data.confidenceThreshold || 0.7
          
          // If no answer or low confidence, try AI first
          if (!hasAnswer || confidence < threshold) {
            try {
              const aiResult = await contentScriptAPI.send('getLLMSuggestion', {
                fieldPath: backend.path,
                currentValue: backend.currentValue(),
              })
              
              if (aiResult.ok && aiResult.data?.success && aiResult.data?.data) {
                await backend.fillWithValue(aiResult.data.data)
                await refresh()
                return // AI fill succeeded, don't proceed with normal fill
              }
            } catch (aiError) {
              // AI failed, fall back to normal fill
              console.log('AI suggestion failed, falling back to normal fill:', aiError)
            }
          }
        }
      }
      
      // Normal fill
      await backend.fill()
      await refresh()
    } finally {
      setFillButtonDisabled(false)
    }
  }

  const handleAIAnswer = async () => {
    // Get AI suggestion through content script
    const result = await contentScriptAPI.send('getLLMSuggestion', {
      fieldPath: backend.path,
      currentValue: backend.currentValue(),
    })
    
    if (result.ok && result.data?.success && result.data?.data) {
      // Fill the field with AI suggestion
      await backend.fillWithValue(result.data.data)
      await refresh()
    } else {
      throw new Error(result.data?.error || 'Failed to get AI suggestion')
    }
  }

  const {saveButtonClickHandler} = backend
  const moreInfoPopper = usePopperState({init, backend})
  const value: AppContextType = {
    backend,
    refresh,
    init,
    deleteAnswer,
    editableAnswer,
    setEditableAnswer,
    currentValue,
    setCurrentValue,
    isFilled,
    moreInfoPopper,
    editableAnswerState,
    fieldNotice,
    fillButton: {
      isDisabled: fillButtonDisabled,
      onClick: handleFill,
      isFilled: editableAnswerState.answers.length > 0 && isFilled,
    },
    saveButton: {
      showSuccessBadge: editableAnswerState.answers.length > 0,
      clickHandler: () => {
        saveButtonClickHandler(backend.fieldSnapshot, {
          moreInfoPopper,
          init,
          editableAnswerState,
          backend,
        })
      },
    },
    aiAnswer: {
      isEnabled: aiEnabled,
      onClick: handleAIAnswer,
    },
  }
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
