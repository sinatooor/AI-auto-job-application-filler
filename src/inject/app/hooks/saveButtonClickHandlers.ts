import { Answer } from '@src/shared/utils/types'
import { AppContextType } from '../AppContext'
import { contentScriptAPI } from '../services/contentScriptApi'
import { createLogger } from '@src/shared/utils/logger'

const logger = createLogger('SaveButton')

export interface SaveButtonClickHndler {
  (
    newAnswer: Answer,
    context: Pick<
      AppContextType,
      'moreInfoPopper' | 'init' | 'editableAnswerState' | 'backend'
    >
  ): void | Promise<void>
}

const basic: SaveButtonClickHndler = async (newAnswer, { init }) => {
  logger.info('💾 Saving answer (basic)', { 
    data: { 
      fieldName: newAnswer.path.fieldName,
      fieldType: newAnswer.path.fieldType 
    } 
  })
  
  const resp = await contentScriptAPI.send('addAnswer', newAnswer)
  if (resp.ok) {
    logger.success('Answer saved, reinitializing...')
    await init()
  } else {
    logger.error('Failed to save answer', resp.data)
  }
}

const withNotice: SaveButtonClickHndler = async (
  newAnswer,
  { moreInfoPopper }
) => {
  logger.info('💾 Saving answer (with notice)', { 
    data: { 
      fieldName: newAnswer.path.fieldName 
    } 
  })
  moreInfoPopper.open()
  logger.success('Notice popup opened')
}

const backupAnswerList: SaveButtonClickHndler = async (
  newAnswer,
  { editableAnswerState, backend }
) => {
  logger.info('💾 Saving answer (backup list)', { 
    data: { 
      fieldName: newAnswer.path.fieldName,
      existingAnswersCount: editableAnswerState.answers.length 
    } 
  })
  
  const { answers, init } = editableAnswerState
  if (answers.length === 0) {
    logger.debug('No existing answers, saving new one')
    await backend.save(newAnswer)
    await init()
    logger.success('Answer saved')
  } else if (answers[0].originalAnswer.matchType === 'exact') {
    logger.debug('Exact match exists, showing popup for new answer')
    // make a popup that says to add a new answer
  }
}

export const saveButtonClickHandlers = {
  backupAnswerList,
  basic,
  withNotice,
}
