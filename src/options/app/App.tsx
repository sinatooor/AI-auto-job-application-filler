import React, { FC, useEffect, useState } from 'react'
import '../options.css'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Slider,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { ThemeProvider } from '@emotion/react'
import { theme } from '@src/shared/utils/react'
import { LogoTitleBar } from '@src/shared/components/LogoTitleBar'
import {
  CVData,
  ExtractedCVData,
  JobContext,
  LLM_MODELS,
  LLMProvider,
  LLMSettings,
} from '@src/contentScript/utils/storage/LLMTypes'
import {
  addJobContext,
  clearCVData,
  deleteJobContext,
  getActiveJobContext,
  getCVData,
  getJobContextStore,
  getLLMSettings,
  setActiveJobContext,
  setCVData,
  setLLMSettings,
  updateJobContext,
} from '@src/contentScript/utils/storage/LLMSettingsStore'
import { fileToLocalStorage, LocalStorageFile } from '@src/shared/utils/file'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

// LLM Settings Section
const LLMSettingsSection: FC = () => {
  const [settings, setSettings] = useState<LLMSettings | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  useEffect(() => {
    getLLMSettings().then(setSettings)
  }, [])

  const handleProviderChange = async (event: SelectChangeEvent) => {
    const provider = event.target.value as LLMProvider
    const defaultModel = LLM_MODELS[provider][0].id
    await setLLMSettings({ provider, model: defaultModel, apiKey: '' })
    setSettings((prev) => prev ? { ...prev, provider, model: defaultModel, apiKey: '' } : null)
  }

  const handleModelChange = async (event: SelectChangeEvent) => {
    const model = event.target.value
    await setLLMSettings({ model })
    setSettings((prev) => prev ? { ...prev, model } : null)
  }

  const handleApiKeyChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const apiKey = event.target.value
    await setLLMSettings({ apiKey })
    setSettings((prev) => prev ? { ...prev, apiKey } : null)
  }

  const handleAutoFillToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const autoFillEnabled = event.target.checked
    await setLLMSettings({ autoFillEnabled })
    setSettings((prev) => prev ? { ...prev, autoFillEnabled } : null)
  }

  const handleHistoryContextToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const includeHistoryContext = event.target.checked
    await setLLMSettings({ includeHistoryContext })
    setSettings((prev) => prev ? { ...prev, includeHistoryContext } : null)
  }

  const handleThresholdChange = async (_: Event, value: number | number[]) => {
    const confidenceThreshold = (value as number) / 100
    await setLLMSettings({ confidenceThreshold })
    setSettings((prev) => prev ? { ...prev, confidenceThreshold } : null)
  }

  const testConnection = async () => {
    if (!settings?.apiKey) {
      setTestResult({ success: false, message: 'Please enter an API key' })
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'LLM_TEST_CONNECTION',
        payload: {
          provider: settings.provider,
          apiKey: settings.apiKey,
          model: settings.model,
        },
      })
      setTestResult(response)
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to test connection' })
    }
    setTesting(false)
  }

  if (!settings) {
    return <CircularProgress />
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h6">LLM Provider Configuration</Typography>

      <FormControl fullWidth>
        <InputLabel>Provider</InputLabel>
        <Select
          value={settings.provider}
          label="Provider"
          onChange={handleProviderChange}
        >
          <MenuItem value="openai">OpenAI</MenuItem>
          <MenuItem value="gemini">Google Gemini</MenuItem>
          <MenuItem value="anthropic">Anthropic Claude</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel>Model</InputLabel>
        <Select
          value={settings.model}
          label="Model"
          onChange={handleModelChange}
        >
          {LLM_MODELS[settings.provider].map((model) => (
            <MenuItem key={model.id} value={model.id}>
              {model.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="API Key"
        type={showApiKey ? 'text' : 'password'}
        value={settings.apiKey}
        onChange={handleApiKeyChange}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowApiKey(!showApiKey)}>
                {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Stack direction="row" spacing={2} alignItems="center">
        <Button
          variant="outlined"
          onClick={testConnection}
          disabled={testing || !settings.apiKey}
        >
          {testing ? <CircularProgress size={20} /> : 'Test Connection'}
        </Button>
        {testResult && (
          <Alert severity={testResult.success ? 'success' : 'error'} sx={{ flex: 1 }}>
            {testResult.message}
          </Alert>
        )}
      </Stack>

      <Divider />

      <Typography variant="h6">Auto-Fill Settings</Typography>

      <FormControlLabel
        control={
          <Switch
            checked={settings.autoFillEnabled}
            onChange={handleAutoFillToggle}
          />
        }
        label="Enable AI Auto-Fill (use AI when answer confidence is low)"
      />

      <FormControlLabel
        control={
          <Switch
            checked={settings.includeHistoryContext}
            onChange={handleHistoryContextToggle}
          />
        }
        label="Include past answers as context for AI suggestions"
      />

      <Box>
        <Typography gutterBottom>
          Confidence Threshold: {Math.round(settings.confidenceThreshold * 100)}%
        </Typography>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          AI will be triggered when match confidence is below this threshold
        </Typography>
        <Slider
          value={settings.confidenceThreshold * 100}
          onChange={handleThresholdChange}
          min={0}
          max={100}
          valueLabelDisplay="auto"
        />
      </Box>
    </Stack>
  )
}

// CV Section
const CVSection: FC = () => {
  const [cvData, setCvDataState] = useState<CVData | null>(null)
  const [cvText, setCvText] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCVData().then((data) => {
      setCvDataState(data)
      if (data.originalText) {
        setCvText(data.originalText)
      }
    })
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      // Read file content
      const text = await file.text()
      const localFile = await fileToLocalStorage(file)
      
      setCvText(text)
      await setCVData({ originalText: text, originalFile: localFile })
      setCvDataState((prev) => ({ ...prev, originalText: text, originalFile: localFile }))
    } catch (err) {
      setError('Failed to read file')
    }
  }

  const handleTextChange = async (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value
    setCvText(text)
  }

  const handleSaveText = async () => {
    await setCVData({ originalText: cvText })
    setCvDataState((prev) => ({ ...prev, originalText: cvText }))
  }

  const processCV = async () => {
    if (!cvText.trim()) {
      setError('Please enter or upload your CV first')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'LLM_PROCESS_CV',
        payload: { text: cvText },
      })

      if (response.success) {
        await setCVData({ extractedData: response.data })
        setCvDataState((prev) => ({ ...prev, extractedData: response.data }))
      } else {
        setError(response.error || 'Failed to process CV')
      }
    } catch (err) {
      setError('Failed to process CV. Make sure your API key is configured.')
    }

    setProcessing(false)
  }

  const clearCV = async () => {
    await clearCVData()
    setCvDataState(null)
    setCvText('')
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h6">CV / Resume</Typography>
      <Typography variant="body2" color="text.secondary">
        Upload your CV or paste it as text. The AI will extract your information
        to help fill job application forms.
      </Typography>

      <Box>
        <Button
          component="label"
          variant="outlined"
          startIcon={<CloudUploadIcon />}
        >
          Upload CV (PDF, TXT, DOCX)
          <input
            type="file"
            hidden
            accept=".pdf,.txt,.docx,.doc"
            onChange={handleFileUpload}
          />
        </Button>
        {cvData?.originalFile && (
          <Typography variant="caption" sx={{ ml: 2 }}>
            Uploaded: {cvData.originalFile.name}
          </Typography>
        )}
      </Box>

      <TextField
        fullWidth
        multiline
        rows={10}
        label="CV Text"
        placeholder="Paste your CV content here..."
        value={cvText}
        onChange={handleTextChange}
        onBlur={handleSaveText}
      />

      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          onClick={processCV}
          disabled={processing || !cvText.trim()}
        >
          {processing ? <CircularProgress size={20} /> : 'Process CV with AI'}
        </Button>
        <Button variant="outlined" color="error" onClick={clearCV}>
          Clear CV
        </Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {cvData?.extractedData && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Extracted Information
            </Typography>
            <ExtractedDataDisplay data={cvData.extractedData} />
          </CardContent>
        </Card>
      )}
    </Stack>
  )
}

const ExtractedDataDisplay: FC<{ data: ExtractedCVData }> = ({ data }) => {
  return (
    <Stack spacing={2}>
      {data.personalInfo && (
        <Box>
          <Typography variant="subtitle2">Personal Information</Typography>
          <Typography variant="body2">
            {data.personalInfo.fullName && `Name: ${data.personalInfo.fullName}`}
            {data.personalInfo.email && ` | Email: ${data.personalInfo.email}`}
            {data.personalInfo.phone && ` | Phone: ${data.personalInfo.phone}`}
          </Typography>
          {data.personalInfo.city && (
            <Typography variant="body2">
              Location: {[data.personalInfo.city, data.personalInfo.state, data.personalInfo.country].filter(Boolean).join(', ')}
            </Typography>
          )}
        </Box>
      )}

      {data.summary && (
        <Box>
          <Typography variant="subtitle2">Summary</Typography>
          <Typography variant="body2">{data.summary}</Typography>
        </Box>
      )}

      {data.experience?.length > 0 && (
        <Box>
          <Typography variant="subtitle2">Experience</Typography>
          {data.experience.map((exp, i) => (
            <Typography key={i} variant="body2">
              {exp.title} at {exp.company}
              {exp.startDate && ` (${exp.startDate} - ${exp.endDate || 'Present'})`}
            </Typography>
          ))}
        </Box>
      )}

      {data.education?.length > 0 && (
        <Box>
          <Typography variant="subtitle2">Education</Typography>
          {data.education.map((edu, i) => (
            <Typography key={i} variant="body2">
              {edu.degree} {edu.field && `in ${edu.field}`} - {edu.institution}
            </Typography>
          ))}
        </Box>
      )}

      {data.skills?.length > 0 && (
        <Box>
          <Typography variant="subtitle2">Skills</Typography>
          <Typography variant="body2">{data.skills.join(', ')}</Typography>
        </Box>
      )}
    </Stack>
  )
}

// Job Context Section
const JobContextSection: FC = () => {
  const [contexts, setContexts] = useState<JobContext[]>([])
  const [activeId, setActiveId] = useState<string | undefined>()
  const [editingContext, setEditingContext] = useState<JobContext | null>(null)

  const loadContexts = async () => {
    const store = await getJobContextStore()
    setContexts(store.contexts)
    setActiveId(store.activeContextId)
  }

  useEffect(() => {
    loadContexts()
  }, [])

  const handleAddContext = async () => {
    const newContext = await addJobContext({
      name: 'New Job',
      company: '',
      role: '',
      description: '',
      notes: '',
    })
    await loadContexts()
    setEditingContext(newContext)
  }

  const handleDeleteContext = async (id: string) => {
    await deleteJobContext(id)
    await loadContexts()
    if (editingContext?.id === id) {
      setEditingContext(null)
    }
  }

  const handleSelectContext = async (id: string) => {
    await setActiveJobContext(id)
    setActiveId(id)
    const context = contexts.find((c) => c.id === id)
    setEditingContext(context || null)
  }

  const handleUpdateContext = async (field: keyof JobContext, value: string) => {
    if (!editingContext) return
    const updated = { ...editingContext, [field]: value }
    setEditingContext(updated)
    await updateJobContext(editingContext.id, { [field]: value })
    await loadContexts()
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Job Context</Typography>
      <Typography variant="body2" color="text.secondary">
        Add information about jobs you're applying to. This helps the AI provide
        better suggestions tailored to each position.
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap">
        {contexts.map((context) => (
          <Button
            key={context.id}
            variant={context.id === activeId ? 'contained' : 'outlined'}
            size="small"
            onClick={() => handleSelectContext(context.id)}
            endIcon={
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteContext(context.id)
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            }
          >
            {context.name || 'Untitled'}
          </Button>
        ))}
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddContext}
        >
          Add Job
        </Button>
      </Stack>

      {editingContext && (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Job Name (for your reference)"
                value={editingContext.name}
                onChange={(e) => handleUpdateContext('name', e.target.value)}
              />
              <TextField
                fullWidth
                label="Company"
                value={editingContext.company || ''}
                onChange={(e) => handleUpdateContext('company', e.target.value)}
              />
              <TextField
                fullWidth
                label="Role / Position"
                value={editingContext.role || ''}
                onChange={(e) => handleUpdateContext('role', e.target.value)}
              />
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Job Description"
                placeholder="Paste the job description here..."
                value={editingContext.description || ''}
                onChange={(e) => handleUpdateContext('description', e.target.value)}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                placeholder="Any additional notes..."
                value={editingContext.notes || ''}
                onChange={(e) => handleUpdateContext('notes', e.target.value)}
              />
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  )
}

// Main App
export const App: FC = () => {
  const [tabValue, setTabValue] = useState(0)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Paper elevation={0} sx={{ borderRadius: 0 }}>
          <Container maxWidth="md">
            <Box py={2}>
              <LogoTitleBar>Job App Filler - Settings</LogoTitleBar>
            </Box>
          </Container>
        </Paper>

        <Container maxWidth="md" sx={{ py: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="LLM Settings" />
              <Tab label="CV / Resume" />
              <Tab label="Job Context" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <LLMSettingsSection />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <CVSection />
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              <JobContextSection />
            </TabPanel>
          </Paper>
        </Container>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </ThemeProvider>
  )
}
