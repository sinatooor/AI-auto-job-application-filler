import React, { FC, useState, useEffect, useRef } from 'react'
import { Button, CircularProgress, Tooltip } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { useAppContext } from '../AppContext'

export const AIAnswerButton: FC = () => {
  const { backend, refresh, aiAnswer } = useAppContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    try {
      await aiAnswer.onClick()
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI suggestion failed')
    } finally {
      setLoading(false)
    }
  }

  // Listen for auto-fill AI trigger event
  useEffect(() => {
    const handleAutoFill = () => {
      if (aiAnswer.isEnabled && !loading) {
        handleClick()
      }
    }
    
    const element = buttonRef.current?.closest('[data-jaf-field]')
    if (element) {
      element.addEventListener('JAF_TRIGGER_AI_FILL', handleAutoFill)
      return () => {
        element.removeEventListener('JAF_TRIGGER_AI_FILL', handleAutoFill)
      }
    }
  }, [aiAnswer.isEnabled, loading])

  if (!aiAnswer.isEnabled) {
    return null
  }

  return (
    <Tooltip 
      title={error || "Let AI suggest an answer based on your CV"} 
      placement="top" 
      arrow
    >
      <Button 
        ref={buttonRef}
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
