import React, { FC, useState } from 'react'
import { Button, CircularProgress, Tooltip } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { useAppContext } from '../AppContext'
import { createLogger } from '@src/shared/utils/logger'

const logger = createLogger('AIButton')

export const AIAnswerButton: FC = () => {
  const { backend, refresh, aiAnswer } = useAppContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    logger.info('🤖 AI Answer button clicked', { 
      data: { 
        fieldName: backend.fieldName,
        fieldType: backend.fieldType 
      } 
    })
    
    setLoading(true)
    setError(null)
    try {
      await aiAnswer.onClick()
      logger.success('AI suggestion applied successfully')
      await refresh()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'AI suggestion failed'
      logger.error('AI suggestion failed', err)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (!aiAnswer.isEnabled) {
    logger.debug('AI Answer button disabled/hidden')
    return null
  }

  return (
    <Tooltip 
      title={error || "Let AI suggest an answer based on your CV"} 
      placement="top" 
      arrow
    >
      <Button 
        onClick={handleClick} 
        disabled={loading}
        sx={{ 
          minWidth: 'auto',
          color: error ? 'error.main' : undefined,
        }}
      >
        {loading ? (
          <CircularProgress size={18} />
        ) : (
          <AutoAwesomeIcon fontSize="small" />
        )}
      </Button>
    </Tooltip>
  )
}
