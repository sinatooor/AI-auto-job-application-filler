import React, { FC, useState, useEffect } from 'react'
import './popup.css'
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  IconButton,
  Snackbar,
  SnackbarCloseReason,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material'

import { ThemeProvider } from '@emotion/react'
import { theme } from '@src/shared/utils/react'
import { ContentCopyIcon, GitHubIcon, OpenInNewIcon } from '@src/shared/utils/icons'
import { LogoTitleBar } from '@src/shared/components/LogoTitleBar'
import { Tracker } from './Tracker'
import HistoryIcon from '@mui/icons-material/History'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'

const EMAIL_ADDRESS = 'berellevy+chromeextensions@gmail.com'

// Storage keys - must match LLMSettingsStore.ts
const STORAGE_KEY_GLOBAL_ACTIVATION = 'global_activation'

export const App: FC<{}> = () => {
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false)
  const [snackbarMessage, setSnackbarMessage] = useState<string>('')
  const [view, setView] = useState<'home' | 'tracker'>('home')
  const [isActivated, setIsActivated] = useState<boolean>(false)
  const [autoFilling, setAutoFilling] = useState<boolean>(false)

  // Load activation state on mount
  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY_GLOBAL_ACTIVATION).then((result) => {
      setIsActivated(result[STORAGE_KEY_GLOBAL_ACTIVATION] ?? false)
    })
  }, [])

  const handleCloseSnackbar = (
    event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason
  ) => {
    setSnackbarOpen(false)
  }

  const handleToggleActivation = async () => {
    const newState = !isActivated
    setIsActivated(newState)
    
    // Save to storage
    await chrome.storage.local.set({ [STORAGE_KEY_GLOBAL_ACTIVATION]: newState })
    
    if (newState) {
      // When turning on, also activate the current tab
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        if (tabs[0]?.id) {
          await chrome.tabs.sendMessage(tabs[0].id, { type: 'ACTIVATE_EXTENSION' })
        }
      } catch (err) {
        // Ignore errors - the page might not have the content script yet
      }
      setSnackbarMessage('Extension enabled! Will auto-activate on all pages.')
    } else {
      setSnackbarMessage('Extension disabled.')
    }
    setSnackbarOpen(true)
  }

  const handleAutoFillWithAI = async () => {
    setAutoFilling(true)
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tabs[0]?.id) {
        const response = await chrome.tabs.sendMessage(tabs[0].id, { type: 'AUTO_FILL_WITH_AI' })
        if (response?.success) {
          setSnackbarMessage(`AI filled ${response.filledCount || 0} field(s) successfully!`)
        } else {
          setSnackbarMessage(response?.error || 'AI auto-fill completed.')
        }
        setSnackbarOpen(true)
      }
    } catch (err) {
      setSnackbarMessage('Failed to auto-fill. Make sure AI is configured in settings.')
      setSnackbarOpen(true)
    } finally {
      setAutoFilling(false)
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Box pb={'1em'}>
        <LogoTitleBar>Job App Filler</LogoTitleBar>
      </Box>
      <Box component={'main'}>
        <Container sx={{ my: 2 }}>
          {view === 'tracker' ? (
            <Tracker onBack={() => setView('home')} />
          ) : (
            <>
              <Typography variant="h6" sx={{ mb: 1 }}>
                The Best Autofill Since Sliced Bread.
              </Typography>
              
              {/* Global Activation Toggle */}
              <Box sx={{ 
                mb: 2, 
                p: 1.5, 
                border: '1px solid', 
                borderColor: isActivated ? 'success.main' : 'grey.400',
                borderRadius: 1,
                backgroundColor: isActivated ? 'success.light' : 'transparent',
                transition: 'all 0.2s'
              }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isActivated}
                      onChange={handleToggleActivation}
                      color="success"
                    />
                  }
                  label={
                    <Typography variant="body1" fontWeight="medium">
                      {isActivated ? 'Extension Active' : 'Extension Off'}
                    </Typography>
                  }
                  sx={{ m: 0, width: '100%', justifyContent: 'space-between' }}
                  labelPlacement="start"
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {isActivated 
                    ? 'Auto-detecting form fields on all websites' 
                    : 'Enable to detect and fill form fields'}
                </Typography>
              </Box>

              {/* AI Auto Fill Button */}
              <Stack spacing={1} sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  startIcon={autoFilling ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
                  onClick={handleAutoFillWithAI}
                  disabled={autoFilling || !isActivated}
                >
                  {autoFilling ? 'Filling...' : 'Auto Fill with AI'}
                </Button>
              </Stack>

              <Divider sx={{ my: 1 }} />
              
              <Stack direction={'row'} spacing={1}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    chrome.tabs.query(
                      { active: true, currentWindow: true },
                      (tabs) => {
                        chrome.tabs
                          .sendMessage(tabs[0].id, {
                            type: 'SHOW_WHATS_NEW',
                          })
                          .catch((err) => {
                            setSnackbarMessage('Only works on workday sites.')
                            setSnackbarOpen(true)
                          }),
                          () => { }
                      }
                    )
                  }}
                >
                  what's new?
                </Button>
                <Button
                  variant="outlined"
                  href="https://youtu.be/JYMATq9siIY"
                  target="_blank"
                  endIcon={<OpenInNewIcon />}
                >
                  Tutorial
                </Button>
              </Stack>

              <Box sx={{ mt: 2 }}>
                <Stack spacing={1}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => chrome.runtime.openOptionsPage()}
                  >
                    AI Settings & CV Upload
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<HistoryIcon />}
                    fullWidth
                    onClick={() => setView('tracker')}
                  >
                    Application History
                  </Button>
                </Stack>
              </Box>
              <Divider sx={{ my: 2 }} />

              <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
                Feaures
              </Typography>
              <Typography mb={1}>Works. Well.</Typography>
              <Typography mb={1}>Completely free, No login required.</Typography>
              <Typography mb={1}>
                Your data is stored locally, on your browser and isn't sent{' '}
                <em>anywhere</em>.
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box my={1}>
                <Button
                  target="_blank"
                  href="https://github.com/berellevy/job_app_filler"
                  startIcon={<GitHubIcon />}
                  variant="outlined"
                >
                  Contribute
                </Button>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Tooltip title={EMAIL_ADDRESS}>
                  <Button
                    href={'mailto:' + EMAIL_ADDRESS}
                    size="small"
                    variant="text"
                    target="_blank"
                  >
                    Contact
                  </Button>
                </Tooltip>
                <Tooltip title="Copy email address">
                  <IconButton
                    size={'small'}
                    onClick={() => {
                      navigator.clipboard.writeText(EMAIL_ADDRESS)
                      setSnackbarMessage('Copied.')
                      setSnackbarOpen(true)
                    }}
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </>
          )}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={2000}
            onClose={handleCloseSnackbar}
            message={snackbarMessage}
          />
        </Container>
      </Box>
    </ThemeProvider>
  )
}