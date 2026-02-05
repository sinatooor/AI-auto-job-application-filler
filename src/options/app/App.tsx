import React, { FC, useEffect, useState } from 'react'
import '../options.css'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Slider,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { ThemeProvider } from '@emotion/react'
import { theme } from '@src/shared/utils/react'
import { LogoTitleBar } from '@src/shared/components/LogoTitleBar'
import {
  CVAnalysisResult,
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
  saveCoverLetter,
  setActiveJobContext,
  setCVData,
  setLLMSettings,
  updateJobContext,
} from '@src/contentScript/utils/storage/LLMSettingsStore'
import { fileToLocalStorage, LocalStorageFile } from '@src/shared/utils/file'
import { answers1010 } from '@src/contentScript/utils/storage/Answers1010'
import { SavedAnswer } from '@src/contentScript/utils/storage/DataStoreTypes'
import { saveCVDataToDatabase } from '@src/contentScript/utils/storage/cvToAnswers'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import DeleteIcon from '@mui/icons-material/Delete'
import StorageIcon from '@mui/icons-material/Storage'
import AddIcon from '@mui/icons-material/Add'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DownloadIcon from '@mui/icons-material/Download'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import ErrorIcon from '@mui/icons-material/Error'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import RefreshIcon from '@mui/icons-material/Refresh'

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

  const handleAutoSaveLLMAnswersToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const autoSaveLLMAnswers = event.target.checked
    await setLLMSettings({ autoSaveLLMAnswers })
    setSettings((prev) => prev ? { ...prev, autoSaveLLMAnswers } : null)
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

      <FormControlLabel
        control={
          <Switch
            checked={settings.autoSaveLLMAnswers}
            onChange={handleAutoSaveLLMAnswersToggle}
          />
        }
        label="Auto-save LLM answers (automatically save when AI suggests an answer)"
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
  const [saving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<{ added: number; skipped: number } | null>(null)
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
      const localFile = await fileToLocalStorage(file)
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      
      if (isPdf) {
        // For PDFs, don't try to read as text - just store the file
        // The file will be sent directly to Gemini for processing
        setCvText('[PDF file uploaded - will be processed directly by AI]')
        await setCVData({ originalFile: localFile })
        setCvDataState((prev) => ({ ...prev, originalFile: localFile, originalText: undefined }))
      } else {
        // For text files (.txt, .docx), read the content
        const text = await file.text()
        setCvText(text)
        await setCVData({ originalText: text, originalFile: localFile })
        setCvDataState((prev) => ({ ...prev, originalText: text, originalFile: localFile }))
      }
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
    const hasFile = cvData?.originalFile
    const hasText = cvText.trim() && !cvText.startsWith('[PDF file uploaded')
    
    if (!hasFile && !hasText) {
      setError('Please enter or upload your CV first')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'LLM_PROCESS_CV',
        payload: { 
          text: hasText ? cvText : undefined,
          file: hasFile ? cvData.originalFile : undefined
        },
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

  const saveToDatabase = async () => {
    if (!cvData?.extractedData) {
      setError('No extracted data to save. Please process your CV first.')
      return
    }

    setSaving(true)
    setError(null)
    setSaveResult(null)

    try {
      const result = await saveCVDataToDatabase(cvData.extractedData, answers1010)
      setSaveResult(result)
    } catch (err) {
      setError('Failed to save to database. Please try again.')
    }

    setSaving(false)
  }

  const clearCV = async () => {
    await clearCVData()
    setCvDataState(null)
    setCvText('')
    setSaveResult(null)
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
        disabled={cvText.startsWith('[PDF file uploaded')}
      />

      {cvData?.originalFile?.type === 'application/pdf' && (
        <Typography variant="body2" color="info.main">
          PDF files are processed directly by Gemini AI for best results.
        </Typography>
      )}

      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          onClick={processCV}
          disabled={processing || (!cvText.trim() && !cvData?.originalFile)}
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
            
            <Divider sx={{ my: 2 }} />
            
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="contained"
                color="success"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <StorageIcon />}
                onClick={saveToDatabase}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save to Database'}
              </Button>
              
              {saveResult && (
                <Alert severity="success" sx={{ py: 0, flexGrow: 1 }}>
                  Added {saveResult.added} field mappings to the database. 
                  Your CV data is now available for form auto-filling!
                </Alert>
              )}
            </Stack>
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              This will save your extracted CV data as answers in the database. 
              The extension will use these to automatically fill matching form fields.
            </Typography>
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

// Cover Letter Section
const CoverLetterSection: FC = () => {
  const [cvData, setCvDataState] = useState<CVData | null>(null)
  const [jobContext, setJobContext] = useState<JobContext | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [tone, setTone] = useState<'professional' | 'friendly' | 'formal'>('professional')
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [customInstructions, setCustomInstructions] = useState('')

  useEffect(() => {
    const loadData = async () => {
      const cv = await getCVData()
      setCvDataState(cv)
      const job = await getActiveJobContext()
      setJobContext(job || null)
    }
    loadData()
  }, [])

  const generateCoverLetter = async () => {
    if (!cvData?.extractedData) {
      setError('Please process your CV first in the CV/Resume tab')
      return
    }
    if (!jobContext) {
      setError('Please add a job context first in the Job Context tab')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'LLM_GENERATE_COVER_LETTER',
        payload: {
          cvData: cvData.extractedData,
          jobContext,
          tone,
          length,
          customInstructions: customInstructions.trim() || undefined,
        },
      })

      if (response.success) {
        setCoverLetter(response.data)
        await saveCoverLetter({
          content: response.data,
          jobContextId: jobContext.id,
        })
      } else {
        setError(response.error || 'Failed to generate cover letter')
      }
    } catch (err) {
      setError('Failed to generate cover letter. Make sure your API key is configured.')
    }

    setGenerating(false)
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(coverLetter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadAsText = () => {
    const blob = new Blob([coverLetter], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cover_letter_${jobContext?.company || 'job'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadAsDocx = async () => {
    // Create a simple HTML document for Word
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Cover Letter</title>
      </head>
      <body>
        ${coverLetter.split('\n').map(p => `<p>${p}</p>`).join('')}
      </body>
      </html>
    `
    const blob = new Blob([htmlContent], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cover_letter_${jobContext?.company || 'job'}.doc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Cover Letter Generator</Typography>
      <Typography variant="body2" color="text.secondary">
        Generate a personalized cover letter based on your CV and the job description.
        Make sure you have processed your CV and added a job context first.
      </Typography>

      {(!cvData?.extractedData || !jobContext) && (
        <Alert severity="info">
          {!cvData?.extractedData && 'Please process your CV in the CV/Resume tab. '}
          {!jobContext && 'Please add a job context in the Job Context tab.'}
        </Alert>
      )}

      <Stack direction="row" spacing={2}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Tone</InputLabel>
          <Select
            value={tone}
            label="Tone"
            onChange={(e) => setTone(e.target.value as typeof tone)}
          >
            <MenuItem value="professional">Professional</MenuItem>
            <MenuItem value="friendly">Friendly</MenuItem>
            <MenuItem value="formal">Formal</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Length</InputLabel>
          <Select
            value={length}
            label="Length"
            onChange={(e) => setLength(e.target.value as typeof length)}
          >
            <MenuItem value="short">Short (200-300 words)</MenuItem>
            <MenuItem value="medium">Medium (300-450 words)</MenuItem>
            <MenuItem value="long">Long (450-600 words)</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <TextField
        fullWidth
        multiline
        rows={2}
        label="Custom Instructions (optional)"
        placeholder="E.g., Emphasize my leadership experience, mention my relocation flexibility..."
        value={customInstructions}
        onChange={(e) => setCustomInstructions(e.target.value)}
      />

      <Button
        variant="contained"
        onClick={generateCoverLetter}
        disabled={generating || !cvData?.extractedData || !jobContext}
        sx={{ alignSelf: 'flex-start' }}
      >
        {generating ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
        {generating ? 'Generating...' : 'Generate Cover Letter'}
      </Button>

      {error && <Alert severity="error">{error}</Alert>}

      {coverLetter && (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Generated Cover Letter</Typography>
                <Stack direction="row" spacing={1}>
                  <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
                    <IconButton onClick={copyToClipboard} color={copied ? 'success' : 'default'}>
                      {copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download as Text">
                    <IconButton onClick={downloadAsText}>
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={downloadAsDocx}
                  >
                    Download .doc
                  </Button>
                </Stack>
              </Stack>
              <TextField
                fullWidth
                multiline
                rows={15}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  )
}

// CV Analysis Section
const CVAnalysisSection: FC = () => {
  const [cvData, setCvDataState] = useState<CVData | null>(null)
  const [jobContext, setJobContext] = useState<JobContext | null>(null)
  const [analysis, setAnalysis] = useState<CVAnalysisResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      const cv = await getCVData()
      setCvDataState(cv)
      const job = await getActiveJobContext()
      setJobContext(job || null)
    }
    loadData()
  }, [])

  const analyzeCV = async () => {
    if (!cvData?.originalText) {
      setError('Please add your CV first in the CV/Resume tab')
      return
    }
    if (!jobContext) {
      setError('Please add a job context first in the Job Context tab')
      return
    }

    setAnalyzing(true)
    setError(null)

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'LLM_ANALYZE_CV',
        payload: {
          cvText: cvData.originalText,
          cvData: cvData.extractedData,
          jobContext,
        },
      })

      if (response.success) {
        setAnalysis(response.data)
      } else {
        setError(response.error || 'Failed to analyze CV')
      }
    } catch (err) {
      setError('Failed to analyze CV. Make sure your API key is configured.')
    }

    setAnalyzing(false)
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'success'
    if (score >= 50) return 'warning'
    return 'error'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error'
      case 'medium': return 'warning'
      case 'low': return 'info'
      default: return 'default'
    }
  }

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'error'
      case 'medium': return 'warning'
      case 'low': return 'success'
      default: return 'default'
    }
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h6">CV Analysis & Score</Typography>
      <Typography variant="body2" color="text.secondary">
        Analyze how well your CV matches the job description. Get keyword insights,
        ATS compatibility score, and actionable recommendations.
      </Typography>

      {(!cvData?.originalText || !jobContext) && (
        <Alert severity="info">
          {!cvData?.originalText && 'Please add your CV in the CV/Resume tab. '}
          {!jobContext && 'Please add a job context in the Job Context tab.'}
        </Alert>
      )}

      <Button
        variant="contained"
        onClick={analyzeCV}
        disabled={analyzing || !cvData?.originalText || !jobContext}
        sx={{ alignSelf: 'flex-start' }}
      >
        {analyzing ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
        {analyzing ? 'Analyzing...' : 'Analyze CV'}
      </Button>

      {error && <Alert severity="error">{error}</Alert>}

      {analysis && (
        <Stack spacing={3}>
          {/* Overall Score */}
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">Overall Match Score</Typography>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ width: '100%' }}>
                    <LinearProgress
                      variant="determinate"
                      value={analysis.overallScore}
                      color={getScoreColor(analysis.overallScore) as any}
                      sx={{ height: 20, borderRadius: 2 }}
                    />
                  </Box>
                  <Typography variant="h4" color={`${getScoreColor(analysis.overallScore)}.main`}>
                    {analysis.overallScore}%
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {analysis.overallScore >= 75 && 'Excellent match! Your CV is well-suited for this position.'}
                  {analysis.overallScore >= 50 && analysis.overallScore < 75 && 'Good match with room for improvement.'}
                  {analysis.overallScore < 50 && 'Your CV needs significant improvements to match this role.'}
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          {/* Keyword Analysis */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Keyword Analysis</Typography>
              
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }} color="success.main">
                <CheckCircleIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                Matching Keywords ({analysis.keywordAnalysis.matchingKeywords.length})
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {analysis.keywordAnalysis.matchingKeywords.map((kw, i) => (
                  <Chip
                    key={i}
                    label={kw.keyword}
                    size="small"
                    color={getImportanceColor(kw.importance) as any}
                    variant="outlined"
                  />
                ))}
              </Stack>

              <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }} color="error.main">
                <WarningIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                Missing Keywords ({analysis.keywordAnalysis.missingKeywords.length})
              </Typography>
              <Stack spacing={1}>
                {analysis.keywordAnalysis.missingKeywords.map((kw, i) => (
                  <Box key={i}>
                    <Chip
                      label={kw.keyword}
                      size="small"
                      color={getImportanceColor(kw.importance) as any}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      {kw.suggestion}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {/* Section Scores */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Section Breakdown</Typography>
              <Stack spacing={2}>
                {analysis.sections.map((section, i) => (
                  <Box key={i}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2">{section.name}</Typography>
                      <Typography variant="body2" color={`${getScoreColor(section.score)}.main`}>
                        {section.score}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={section.score}
                      color={getScoreColor(section.score) as any}
                      sx={{ height: 8, borderRadius: 1, my: 0.5 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {section.feedback}
                    </Typography>
                    {section.improvements.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        {section.improvements.map((imp, j) => (
                          <Typography key={j} variant="caption" display="block" color="text.secondary">
                            • {imp}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {/* ATS Compatibility */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>ATS Compatibility</Typography>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <Box sx={{ width: '100%' }}>
                  <LinearProgress
                    variant="determinate"
                    value={analysis.atsCompatibility.score}
                    color={getScoreColor(analysis.atsCompatibility.score) as any}
                    sx={{ height: 12, borderRadius: 1 }}
                  />
                </Box>
                <Typography variant="h5" color={`${getScoreColor(analysis.atsCompatibility.score)}.main`}>
                  {analysis.atsCompatibility.score}%
                </Typography>
              </Stack>
              
              {analysis.atsCompatibility.issues.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="error.main">Issues Found:</Typography>
                  {analysis.atsCompatibility.issues.map((issue, i) => (
                    <Typography key={i} variant="body2" color="text.secondary">
                      <ErrorIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5, color: 'error.main' }} />
                      {issue}
                    </Typography>
                  ))}
                </Box>
              )}
              
              {analysis.atsCompatibility.suggestions.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="success.main">Suggestions:</Typography>
                  {analysis.atsCompatibility.suggestions.map((sug, i) => (
                    <Typography key={i} variant="body2" color="text.secondary">
                      <CheckCircleIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5, color: 'success.main' }} />
                      {sug}
                    </Typography>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Strengths & Weaknesses */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="success.main">
                  <CheckCircleIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  Strengths
                </Typography>
                {analysis.strengths.map((s, i) => (
                  <Typography key={i} variant="body2" sx={{ mb: 1 }}>
                    • {s}
                  </Typography>
                ))}
              </CardContent>
            </Card>

            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="warning.main">
                  <WarningIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  Areas to Improve
                </Typography>
                {analysis.weaknesses.map((w, i) => (
                  <Typography key={i} variant="body2" sx={{ mb: 1 }}>
                    • {w}
                  </Typography>
                ))}
              </CardContent>
            </Card>
          </Stack>

          {/* Recommendations */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recommendations</Typography>
              <Stack spacing={2}>
                {analysis.recommendations.map((rec, i) => (
                  <Box key={i} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, borderLeft: 4, borderColor: `${getPriorityColor(rec.priority)}.main` }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <Chip label={rec.priority.toUpperCase()} size="small" color={getPriorityColor(rec.priority) as any} />
                      <Chip label={rec.category} size="small" variant="outlined" />
                    </Stack>
                    <Typography variant="body2">{rec.suggestion}</Typography>
                    {rec.example && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                        Example: {rec.example}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      )}
    </Stack>
  )
}

// Database View Section
const DatabaseViewSection: FC = () => {
  const [answers, setAnswers] = useState<SavedAnswer[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editedAnswer, setEditedAnswer] = useState<SavedAnswer | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newAnswer, setNewAnswer] = useState({
    section: '',
    fieldType: '',
    fieldName: '',
    answer: '',
  })

  const loadAnswers = async () => {
    setLoading(true)
    await answers1010.load()
    const allAnswers = answers1010.getAll()
    setAnswers(allAnswers)
    setLoading(false)
  }

  useEffect(() => {
    loadAnswers()
  }, [])

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleEdit = (answer: SavedAnswer) => {
    setEditingId(answer.id)
    setEditedAnswer({ ...answer })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditedAnswer(null)
  }

  const handleSaveEdit = async () => {
    if (editedAnswer) {
      answers1010.update(editedAnswer)
      await loadAnswers()
      setEditingId(null)
      setEditedAnswer(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this answer?')) {
      answers1010.delete(id)
      await loadAnswers()
    }
  }

  const handleAddNew = async () => {
    if (!newAnswer.section || !newAnswer.fieldType || !newAnswer.fieldName) {
      alert('Please fill in Section, Field Type, and Field Name')
      return
    }
    
    try {
      // Try to parse answer as JSON if it looks like JSON
      let parsedAnswer = newAnswer.answer
      if (newAnswer.answer.trim().startsWith('{') || newAnswer.answer.trim().startsWith('[')) {
        try {
          parsedAnswer = JSON.parse(newAnswer.answer)
        } catch {
          // Keep as string if JSON parse fails
        }
      }
      
      answers1010.add({
        section: newAnswer.section,
        fieldType: newAnswer.fieldType,
        fieldName: newAnswer.fieldName,
        answer: parsedAnswer,
      })
      await loadAnswers()
      setAddDialogOpen(false)
      setNewAnswer({ section: '', fieldType: '', fieldName: '', answer: '' })
    } catch (error) {
      alert('Failed to add answer: ' + (error as Error).message)
    }
  }

  const displayAnswer = (answer: any) => {
    if (typeof answer === 'object') {
      return JSON.stringify(answer, null, 2)
    }
    return String(answer)
  }

  const paginatedAnswers = answers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Saved Answers Database</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadAnswers}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add New Answer
          </Button>
        </Stack>
      </Stack>

      <Typography variant="body2" color="text.secondary">
        View and manage all saved form answers. You can edit, delete, or add new entries.
      </Typography>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Section</TableCell>
                <TableCell>Field Type</TableCell>
                <TableCell>Field Name</TableCell>
                <TableCell>Answer</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : paginatedAnswers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No saved answers yet. Start by filling out a form or add a new answer.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAnswers.map((answer) => (
                  <TableRow key={answer.id} hover>
                    <TableCell>{answer.id}</TableCell>
                    <TableCell>
                      {editingId === answer.id ? (
                        <TextField
                          size="small"
                          value={editedAnswer?.section || ''}
                          onChange={(e) =>
                            setEditedAnswer({ ...editedAnswer!, section: e.target.value })
                          }
                        />
                      ) : (
                        answer.section
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === answer.id ? (
                        <TextField
                          size="small"
                          value={editedAnswer?.fieldType || ''}
                          onChange={(e) =>
                            setEditedAnswer({ ...editedAnswer!, fieldType: e.target.value })
                          }
                        />
                      ) : (
                        answer.fieldType
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === answer.id ? (
                        <TextField
                          size="small"
                          value={editedAnswer?.fieldName || ''}
                          onChange={(e) =>
                            setEditedAnswer({ ...editedAnswer!, fieldName: e.target.value })
                          }
                        />
                      ) : (
                        answer.fieldName
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === answer.id ? (
                        <TextField
                          size="small"
                          multiline
                          maxRows={4}
                          value={displayAnswer(editedAnswer?.answer)}
                          onChange={(e) => {
                            let value: any = e.target.value
                            // Try to parse as JSON
                            try {
                              if (value.trim().startsWith('{') || value.trim().startsWith('[')) {
                                value = JSON.parse(value)
                              }
                            } catch {
                              // Keep as string if parsing fails
                            }
                            setEditedAnswer({ ...editedAnswer!, answer: value })
                          }}
                          sx={{ minWidth: 200 }}
                        />
                      ) : (
                        <Tooltip title={displayAnswer(answer.answer)}>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 300,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {displayAnswer(answer.answer)}
                          </Typography>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {editingId === answer.id ? (
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={handleSaveEdit}
                          >
                            <SaveIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={handleCancelEdit}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ) : (
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(answer)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(answer.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={answers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Add New Answer Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Answer</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Section"
              placeholder="e.g., personal-information, work-experience"
              value={newAnswer.section}
              onChange={(e) => setNewAnswer({ ...newAnswer, section: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Field Type"
              placeholder="e.g., text, single-select, multi-select"
              value={newAnswer.fieldType}
              onChange={(e) => setNewAnswer({ ...newAnswer, fieldType: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Field Name"
              placeholder="e.g., first name, email, phone"
              value={newAnswer.fieldName}
              onChange={(e) => setNewAnswer({ ...newAnswer, fieldName: e.target.value })}
              required
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Answer"
              placeholder="Enter the answer value (can be JSON for complex types)"
              value={newAnswer.answer}
              onChange={(e) => setNewAnswer({ ...newAnswer, answer: e.target.value })}
              helperText="For simple text, just type. For arrays/objects, use JSON format."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddNew}>
            Add Answer
          </Button>
        </DialogActions>
      </Dialog>
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
            <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
              <Tab label="LLM Settings" />
              <Tab label="CV / Resume" />
              <Tab label="Job Context" />
              <Tab label="Cover Letter" />
              <Tab label="CV Analysis" />
              <Tab label="Database" />
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
            <TabPanel value={tabValue} index={3}>
              <CoverLetterSection />
            </TabPanel>
            <TabPanel value={tabValue} index={4}>
              <CVAnalysisSection />
            </TabPanel>
            <TabPanel value={tabValue} index={5}>
              <DatabaseViewSection />
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
