import React, { FC, useState, useEffect, useRef } from 'react'
import { Button, CircularProgress, Tooltip } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { useAppContext } from '../AppContext'
import { contentScriptAPI } from '../services/contentScriptApi'

export const AIAnswerButton: FC = () => {
  const { backend, refresh, aiAnswer } = useAppContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasApiKey, setHasApiKey] = useState(aiAnswer.isEnabled)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Check for API key on mount and periodically
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const result = await contentScriptAPI.send('getLLMSettings')
        if (result.ok && result.data?.apiKey) {
          setHasApiKey(true)
        } else {
          setHasApiKey(false)
        }
      } catch (error) {
        console.error('Failed to check API key:', error)
      }
    }
    checkApiKey()
    // Re-check every 5 seconds in case user configures API key
    const interval = setInterval(checkApiKey, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleClick = async () => {
    // Re-check API key status before proceeding
    try {
      const result = await contentScriptAPI.send('getLLMSettings')
      if (!result.ok || !result.data?.apiKey) {
        setHasApiKey(false)
        setError('Configure API key in extension settings first')
        return
      }
      setHasApiKey(true)
    } catch (e) {
      console.error('Failed to check API key:', e)
      // If check fails, we can't proceed safely, but maybe we should try anyway?
      // For now, let's assume if check fails, we can't use AI.
      setError('Connection to extension failed. Please refresh the page.')
      return
    }
    
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
      if (hasApiKey && !loading) {
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
  }, [hasApiKey, loading])

  const tooltipText = !hasApiKey 
    ? 'Configure API key in extension settings to enable AI suggestions'
    : error 
      ? error 
      : 'Let AI suggest an answer based on your CV'

  return (
    <Tooltip 
      title={tooltipText} 
      placement="top" 
      arrow
    >
      <span> {/* Wrapper needed for disabled button tooltip */}
        <Button 
          ref={buttonRef}
          onClick={handleClick} 
          disabled={loading}
          sx={{ 
            minWidth: 'auto',
            color: error ? 'error.main' : !hasApiKey ? 'action.disabled' : undefined,
            opacity: !hasApiKey ? 0.5 : 1,
          }}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            <AutoAwesomeIcon />
          )}
        </Button>
      </span>
    </Tooltip>
  )
}
