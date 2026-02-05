import React, { FC, useState } from 'react'
import { Button, CircularProgress, Tooltip } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { useAppContext } from '../AppContext'

export const AIAnswerButton: FC = () => {
  const { backend, refresh, aiAnswer } = useAppContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
