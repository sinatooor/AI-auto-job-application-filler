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
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DownloadIcon from '@mui/icons-material/Download'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import ErrorIcon from '@mui/icons-material/Error'

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
