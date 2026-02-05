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
import { createLogger } from '@src/shared/utils/logger'

const logger = createLogger('AppContext')

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
    logger.info('AppContext initializing...', { 
      data: { 
        fieldName: backend.fieldName,
        fieldType: backend.fieldType 
      } 
    })
    
    ;(async () => {
      logger.debug('Loading editable answer state...')
      await editableAnswerState.init()
      
      logger.debug('Refreshing current value...')
      await refresh()
      
      logger.debug('Handling autofill...')
      await handleFill()
      
      // Check if AI is enabled
      logger.debug('Checking AI settings...')
      const llmSettings = await contentScriptAPI.send('getLLMSettings')
      if (llmSettings.ok && llmSettings.data?.apiKey) {
        logger.success('AI features enabled')
        setAiEnabled(true)
      } else {
        logger.debug('AI features disabled - no API key configured')
      }
      
      logger.success('AppContext initialized successfully')
    })()
    
    backend.element.addEventListener(backend.reactMessageEventId, refresh)
    return () => {
      backend.element.removeEventListener(backend.reactMessageEventId, refresh)
      logger.debug('AppContext cleanup completed')
    }
  }, [])

  const init = async () => {
    await editableAnswerState.init()
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
    logger.info('Deleting answer', { data: { id } })
    await backend.deleteAnswer(id)
    await refresh()
    logger.success('Answer deleted and view refreshed')
  }

  const handleFill = async () => {
    logger.group('🎯 Auto-filling field', false)
    logger.info('Starting autofill process', { 
      data: { 
        fieldName: backend.fieldName,
        fieldType: backend.fieldType 
      } 
    })
    
    setFillButtonDisabled(true)
    try {
      // Check if we should use AI auto-fill
      logger.debug('Checking LLM settings for auto-fill...')
      const llmSettings = await contentScriptAPI.send('getLLMSettings')
      
      if (llmSettings.ok && llmSettings.data?.autoFillEnabled && llmSettings.data?.apiKey) {
        logger.info('AI auto-fill is enabled, checking confidence...')
        
        // Check answer confidence
        const confidenceResult = await contentScriptAPI.send('getAnswerConfidence', backend.path)
        
        if (confidenceResult.ok) {
          const { hasAnswer, confidence } = confidenceResult.data || {}
          const threshold = llmSettings.data.confidenceThreshold || 0.7
          
          logger.debug('Answer confidence check', { 
            data: { 
              hasAnswer, 
              confidence, 
              threshold,
              willUseAI: !hasAnswer || confidence < threshold 
            } 
          })
          
          // If no answer or low confidence, try AI first
          if (!hasAnswer || confidence < threshold) {
            logger.info('Low confidence or no answer, trying AI suggestion...')
            try {
              const aiResult = await contentScriptAPI.send('getLLMSuggestion', {
                fieldPath: backend.path,
                currentValue: backend.currentValue(),
              })
              
              if (aiResult.ok && aiResult.data?.success && aiResult.data?.data) {
                logger.success('AI suggestion received, filling field...')
                await backend.fillWithValue(aiResult.data.data)
                
                // Check if auto-save is enabled for LLM answers
                if (llmSettings.data?.autoSaveLLMAnswers) {
                  logger.info('Auto-save is enabled, saving AI answer...')
                  const answer = backend.fieldSnapshot
                  await backend.save(answer)
                  logger.success('AI answer auto-saved')
                }
                
                await refresh()
                logger.groupEnd()
                return // AI fill succeeded, don't proceed with normal fill
              } else {
                logger.warn('AI suggestion unavailable, falling back to normal fill')
              }
            } catch (aiError) {
              // AI failed, fall back to normal fill
              logger.error('AI suggestion failed, falling back to normal fill', aiError)
            }
          } else {
            logger.info('High confidence answer available, using normal fill')
          }
        }
      } else {
        logger.debug('AI auto-fill disabled or not configured')
      }
      
      // Normal fill
      logger.info('Performing normal autofill...')
      await backend.fill()
      await refresh()
      logger.success('Field autofilled successfully')
    } catch (error) {
      logger.error('Autofill failed', error)
      throw error
    } finally {
      setFillButtonDisabled(false)
      logger.groupEnd()
    }
  }

  const handleAIAnswer = async () => {
    logger.group('🤖 Getting AI answer', false)
    logger.info('Requesting AI suggestion...', { 
      data: { 
        fieldPath: backend.path,
        currentValue: backend.currentValue() 
      } 
    })
    
    // Get AI suggestion through content script
    const result = await contentScriptAPI.send('getLLMSuggestion', {
      fieldPath: backend.path,
      currentValue: backend.currentValue(),
    })
    
    if (result.ok && result.data?.success && result.data?.data) {
      logger.success('AI suggestion received', { data: { suggestion: result.data.data } })
      // Fill the field with AI suggestion
      await backend.fillWithValue(result.data.data)
      
      // Check if auto-save is enabled
      const llmSettings = await contentScriptAPI.send('getLLMSettings')
      if (llmSettings.ok && llmSettings.data?.autoSaveLLMAnswers) {
        logger.info('Auto-save is enabled, saving AI answer...')
        const answer = backend.fieldSnapshot
        await backend.save(answer)
        logger.success('AI answer auto-saved')
      }
      
      await refresh()
      logger.success('Field filled with AI suggestion')
      logger.groupEnd()
    } else {
      const errorMsg = result.data?.error || 'Failed to get AI suggestion'
      logger.error('AI suggestion failed', errorMsg)
      logger.groupEnd()
      throw new Error(errorMsg)
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
