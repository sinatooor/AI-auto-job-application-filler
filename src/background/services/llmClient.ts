import mammoth from 'mammoth'
import { 
  AIFillPagePayload,
  AIFillPageResult,
  AnalyzeCVPayload,
  CVAnalysisResult,
  ExtractedCVData, 
  GenerateCoverLetterPayload, 
  LLMProvider, 
  LLMResponse, 
  LLMSuggestFieldPayload 
} from '@src/contentScript/utils/storage/LLMTypes'
import { LocalStorageFile } from '@src/shared/utils/file'

/**
 * Check if a file is a Word document (.docx or .doc)
 */
function isWordDocument(file: LocalStorageFile): boolean {
  const mimeType = file.type?.toLowerCase() || ''
  const fileName = file.name?.toLowerCase() || ''
  return (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    fileName.endsWith('.docx') ||
    fileName.endsWith('.doc')
  )
}

/**
 * Extract text from a Word document using mammoth.
 * Converts .docx files to plain text for processing by LLMs that don't support Word format.
 */
async function extractTextFromWordDocument(file: LocalStorageFile): Promise<string> {
  // Decode base64 to get the raw bytes
  const base64Data = file.body.split(',')[1]
  const byteString = atob(base64Data)
  const byteArray = new Uint8Array(byteString.length)
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i)
  }

  // Use mammoth to extract text from the Word document
  const result = await mammoth.extractRawText({ arrayBuffer: byteArray.buffer })
  
  if (!result.value || result.value.trim().length === 0) {
    throw new Error('Could not extract text from Word document')
  }

  return result.value
}

interface LLMClientConfig {
  provider: LLMProvider
  apiKey: string
  model: string
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface GeminiUploadedFile {
  fileUri: string
  mimeType: string
}

/**
 * Uploads a file to Gemini Files API and returns { fileUri, mimeType }.
 * Uses the documented files:upload endpoint for multipart upload.
 */
async function uploadFileToGemini(
  apiKey: string,
  file: LocalStorageFile
): Promise<GeminiUploadedFile> {
  const { name, type, body } = file
  const mimeType = type || 'application/pdf'

  // Decode base64 to get the raw bytes
  // The body is a DataURL: "data:application/pdf;base64,..."
  const base64Data = body.split(',')[1]
  const byteString = atob(base64Data)
  const byteArray = new Uint8Array(byteString.length)
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i)
  }

  // Gemini Files API upload endpoint
  const uploadUrl =
    `https://generativelanguage.googleapis.com/v1beta/files?key=${encodeURIComponent(apiKey)}`

  // Multipart upload with JSON metadata + raw bytes
  const boundary = '----gemini-boundary-' + Math.random().toString(16).slice(2)

  const metadataPart =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=utf-8\r\n\r\n` +
    JSON.stringify({
      file: { display_name: name },
    }) +
    `\r\n`

  const fileHeaderPart =
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${name}"\r\n\r\n`

  const closingPart = `\r\n--${boundary}--\r\n`

  // Combine all parts into a single ArrayBuffer
  const encoder = new TextEncoder()
  const metadataBytes = encoder.encode(metadataPart)
  const fileHeaderBytes = encoder.encode(fileHeaderPart)
  const closingBytes = encoder.encode(closingPart)

  const totalLength = metadataBytes.length + fileHeaderBytes.length + byteArray.length + closingBytes.length
  const bodyBuffer = new Uint8Array(totalLength)
  
  let offset = 0
  bodyBuffer.set(metadataBytes, offset)
  offset += metadataBytes.length
  bodyBuffer.set(fileHeaderBytes, offset)
  offset += fileHeaderBytes.length
  bodyBuffer.set(byteArray, offset)
  offset += byteArray.length
  bodyBuffer.set(closingBytes, offset)

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: bodyBuffer,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Gemini file upload failed (${response.status}): ${text}`)
  }

  const json = await response.json()

  // The response contains the uploaded file resource
  // Typical shape: { file: { uri: "files/...", mimeType: "...", ... } }
  const uploadedFile = json.file ?? json
  const fileUri = uploadedFile.uri || uploadedFile.name

  if (!fileUri) {
    throw new Error('Gemini file upload succeeded but file URI not found in response')
  }

  return { fileUri, mimeType }
}

/**
 * Calls Gemini API with inline base64 file data for content generation.
 * This is simpler than using Files API and works well for CV-sized documents.
 */
async function callGeminiWithInlineFile(
  config: LLMClientConfig,
  file: LocalStorageFile,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`
  
  // Extract base64 data from the DataURL
  const base64Data = file.body.split(',')[1]
  const mimeType = file.type || 'application/pdf'

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { 
              inlineData: { 
                mimeType: mimeType, 
                data: base64Data 
              } 
            },
            { text: `${systemPrompt}\n\n${userPrompt}` },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

/**
 * Calls Gemini API with an uploaded file reference for content generation.
 * Used when file was uploaded via Files API.
 */
async function callGeminiWithFile(
  config: LLMClientConfig,
  uploadedFile: GeminiUploadedFile,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { fileData: { mimeType: uploadedFile.mimeType, fileUri: uploadedFile.fileUri } },
            { text: `${systemPrompt}\n\n${userPrompt}` },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

/**
 * Calls OpenAI API with a file (PDF) for content generation.
 * Uses the file content type in chat completions for GPT-4o models.
 */
async function callOpenAIWithFile(
  config: LLMClientConfig,
  file: LocalStorageFile,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  // Extract base64 data from the DataURL
  const base64Data = file.body.split(',')[1]
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'file',
              file: {
                filename: file.name,
                file_data: `data:${file.type};base64,${base64Data}`,
              },
            },
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 8192,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

/**
 * Calls Anthropic API with a file (PDF) for content generation.
 * Claude 3.5 supports PDFs via base64 document blocks.
 */
async function callAnthropicWithFile(
  config: LLMClientConfig,
  file: LocalStorageFile,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  // Extract base64 data from the DataURL
  const base64Data = file.body.split(',')[1]
  
  // Determine media type for Anthropic
  let mediaType = 'application/pdf'
  if (file.type) {
    mediaType = file.type
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `Anthropic API error: ${response.status}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text || ''
}

// OpenAI API client
async function callOpenAI(config: LLMClientConfig, messages: ChatMessage[]): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.3,
      max_tokens: 4096,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

// Google Gemini API client
async function callGemini(config: LLMClientConfig, messages: ChatMessage[]): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`
  
  // Convert chat messages to Gemini format
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  // Prepend system message to first user message
  const systemMessage = messages.find(m => m.role === 'system')
  if (systemMessage && contents.length > 0) {
    contents[0].parts[0].text = `${systemMessage.content}\n\n${contents[0].parts[0].text}`
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// Anthropic Claude API client
async function callAnthropic(config: LLMClientConfig, messages: ChatMessage[]): Promise<string> {
  const systemMessage = messages.find(m => m.role === 'system')?.content || ''
  const chatMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role,
      content: m.content,
    }))

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 4096,
      system: systemMessage,
      messages: chatMessages,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `Anthropic API error: ${response.status}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text || ''
}

// Main LLM client function
export async function callLLM(config: LLMClientConfig, messages: ChatMessage[]): Promise<string> {
  switch (config.provider) {
    case 'openai':
      return callOpenAI(config, messages)
    case 'gemini':
      return callGemini(config, messages)
    case 'anthropic':
      return callAnthropic(config, messages)
    default:
      throw new Error(`Unknown provider: ${config.provider}`)
  }
}

// Test connection to LLM provider
export async function testConnection(config: LLMClientConfig): Promise<LLMResponse<boolean>> {
  try {
    const response = await callLLM(config, [
      { role: 'user', content: 'Reply with exactly: OK' }
    ])
    
    if (response.toLowerCase().includes('ok')) {
      return { success: true, data: true }
    }
    return { success: true, data: true, error: 'Unexpected response but connection works' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}

// Process CV and extract structured data
// When a file is provided and the provider is Gemini, the file is uploaded directly to Gemini's Files API
export async function processCV(
  config: LLMClientConfig,
  cvText?: string,
  file?: LocalStorageFile
): Promise<LLMResponse<ExtractedCVData>> {
  const systemPrompt = `You are an expert CV/Resume parser. Extract structured information from the provided CV/Resume.
Return ONLY valid JSON matching this exact structure (omit fields that are not present):

{
  "personalInfo": {
    "fullName": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "address": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "country": "string",
    "linkedIn": "string",
    "github": "string",
    "website": "string"
  },
  "summary": "string",
  "experience": [
    {
      "company": "string",
      "title": "string",
      "location": "string",
      "startDate": "string (e.g., Jan 2020)",
      "endDate": "string (e.g., Dec 2023 or Present)",
      "current": boolean,
      "description": "string"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "startDate": "string",
      "endDate": "string",
      "gpa": "string"
    }
  ],
  "skills": ["string"],
  "languages": [
    {
      "language": "string",
      "proficiency": "string"
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "string"
    }
  ],
  "customFields": {}
}

Be thorough and extract all available information. Parse dates into readable formats. Return ONLY the JSON, no other text.`

  const userPrompt = 'Parse this CV/Resume document and extract all information.'

  try {
    let response: string

    // If we have a file, use provider-specific file handling
    if (file) {
      // For Word documents, extract text first since most LLM APIs don't support .docx format directly
      if (isWordDocument(file)) {
        const extractedText = await extractTextFromWordDocument(file)
        response = await callLLM(config, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Parse this CV:\n\n${extractedText}` }
        ])
      } else {
        // For PDFs and other supported formats, use provider-specific file handling
        switch (config.provider) {
          case 'gemini': {
            // Use inline base64 data for Gemini (simpler and more reliable)
            response = await callGeminiWithInlineFile(config, file, systemPrompt, userPrompt)
            break
          }
          case 'openai': {
            // Use OpenAI's file content type in chat completions
            response = await callOpenAIWithFile(config, file, systemPrompt, userPrompt)
            break
          }
          case 'anthropic': {
            // Use Anthropic's document block for PDFs
            response = await callAnthropicWithFile(config, file, systemPrompt, userPrompt)
            break
          }
          default:
            throw new Error(`Unknown provider: ${config.provider}`)
        }
      }
    } else if (cvText) {
      // Fallback to text-based processing
      response = await callLLM(config, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Parse this CV:\n\n${cvText}` }
      ])
    } else {
      return { success: false, error: 'No CV text or file provided' }
    }

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse CV: No JSON in response')
    }

    const extractedData: ExtractedCVData = JSON.parse(jsonMatch[0])
    return { success: true, data: extractedData }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process CV',
    }
  }
}

// Suggest a value for a form field
export async function suggestFieldValue(
  config: LLMClientConfig,
  payload: LLMSuggestFieldPayload
): Promise<LLMResponse<string>> {
  const { fieldPath, currentValue, cvData, jobContext, pastAnswers } = payload

  let contextParts: string[] = []

  if (cvData) {
    contextParts.push(`=== CANDIDATE CV DATA ===
${JSON.stringify(cvData, null, 2)}`)
  }

  if (jobContext) {
    contextParts.push(`=== JOB CONTEXT ===
Company: ${jobContext.company || 'Not specified'}
Role: ${jobContext.role || 'Not specified'}
Job Description: ${jobContext.description || 'Not provided'}
Notes: ${jobContext.notes || 'None'}`)
  }

  if (pastAnswers && pastAnswers.length > 0) {
    contextParts.push(`=== PAST ANSWERS (for reference) ===
${pastAnswers.map(a => `${a.fieldName}: ${JSON.stringify(a.answer)}`).join('\n')}`)
  }

  const systemPrompt = `You are an expert job application assistant. Your task is to suggest the best value for a form field based on the candidate's CV and job context.

Rules:
1. Respond with ONLY the suggested value, no explanations
2. Match the expected format for the field type
3. Be concise and professional
4. If you cannot determine an appropriate value, respond with: [UNKNOWN]
5. For text fields, provide direct text
6. For dropdown/select fields, provide the option that best matches
7. For yes/no fields, respond with exactly "Yes" or "No"
8. For date fields, use a standard format like "MM/DD/YYYY" or "January 2024"

${contextParts.join('\n\n')}`

  const userPrompt = `Suggest a value for this form field:

Field Name: ${fieldPath.fieldName}
Field Type: ${fieldPath.fieldType}
Section: ${fieldPath.section}
${currentValue ? `Current Value: ${currentValue}` : 'Currently empty'}

Provide ONLY the suggested value:`

  try {
    const response = await callLLM(config, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ])

    const suggestion = response.trim()
    if (suggestion === '[UNKNOWN]' || !suggestion) {
      return { success: false, error: 'Could not determine appropriate value' }
    }

    return { success: true, data: suggestion }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get suggestion',
    }
  }
}

// Generate cover letter
export async function generateCoverLetter(
  config: LLMClientConfig,
  payload: GenerateCoverLetterPayload
): Promise<LLMResponse<string>> {
  const { cvData, jobContext, tone = 'professional', length = 'medium', customInstructions } = payload

  const lengthGuide = {
    short: '200-300 words, 2-3 paragraphs',
    medium: '300-450 words, 3-4 paragraphs',
    long: '450-600 words, 4-5 paragraphs'
  }

  const toneGuide = {
    professional: 'Professional and confident, focusing on qualifications and achievements',
    friendly: 'Warm and personable while remaining professional, showing personality',
    formal: 'Highly formal and traditional, suitable for conservative industries'
  }

  const systemPrompt = `You are an expert cover letter writer with years of experience helping candidates land interviews. Your goal is to write compelling, personalized cover letters that highlight the candidate's relevant experience and enthusiasm for the role.

Guidelines:
1. Tone: ${toneGuide[tone]}
2. Length: ${lengthGuide[length]}
3. Structure:
   - Opening: Hook the reader, mention the specific role and company
   - Body: Connect candidate's experience to job requirements, use specific examples
   - Closing: Express enthusiasm, include call to action
4. DO NOT use generic phrases like "I am writing to apply..." or "I believe I am a good fit..."
5. Use specific achievements and metrics from the CV when possible
6. Tailor the letter specifically to the job description
7. Show knowledge of the company if any context is provided
8. Be authentic - avoid overly formal or robotic language

${customInstructions ? `Additional instructions: ${customInstructions}` : ''}`

  const cvContext = `
=== CANDIDATE INFORMATION ===
Name: ${cvData.personalInfo?.fullName || 'Not provided'}
Email: ${cvData.personalInfo?.email || 'Not provided'}
Phone: ${cvData.personalInfo?.phone || 'Not provided'}

Summary: ${cvData.summary || 'Not provided'}

Experience:
${cvData.experience?.map(exp => 
  `- ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})
   ${exp.description || ''}`
).join('\n') || 'Not provided'}

Education:
${cvData.education?.map(edu => 
  `- ${edu.degree || ''} ${edu.field ? `in ${edu.field}` : ''} from ${edu.institution}`
).join('\n') || 'Not provided'}

Skills: ${cvData.skills?.join(', ') || 'Not provided'}
`

  const jobContextStr = `
=== JOB DETAILS ===
Company: ${jobContext.company || 'Not specified'}
Role: ${jobContext.role || 'Not specified'}

Job Description:
${jobContext.description || 'Not provided'}

Additional Notes:
${jobContext.notes || 'None'}
`

  try {
    const response = await callLLM(config, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Write a cover letter for this candidate and job:\n${cvContext}\n${jobContextStr}` }
    ])

    return { success: true, data: response.trim() }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate cover letter',
    }
  }
}

// Analyze CV against job description
export async function analyzeCV(
  config: LLMClientConfig,
  payload: AnalyzeCVPayload
): Promise<LLMResponse<CVAnalysisResult>> {
  const { cvText, cvFile, cvData, jobContext } = payload

  // Determine the CV text to use for analysis
  let cvContentForAnalysis: string
  
  if (cvFile) {
    // If a file is provided, extract text from it
    if (isWordDocument(cvFile)) {
      cvContentForAnalysis = await extractTextFromWordDocument(cvFile)
    } else {
      // For PDFs and other formats, we can't easily extract text in the background
      // So we'll indicate that the file was provided but text extraction isn't supported
      return {
        success: false,
        error: 'Please process your CV first to extract text, or upload a Word document (.docx)',
      }
    }
  } else if (cvText) {
    cvContentForAnalysis = cvText
  } else {
    return {
      success: false,
      error: 'No CV content provided for analysis',
    }
  }

  const systemPrompt = `You are an expert ATS (Applicant Tracking System) and career coach. Analyze the provided CV against the job description and provide detailed feedback.

Your analysis must be returned as valid JSON matching this EXACT structure:

{
  "overallScore": <number 0-100>,
  "keywordAnalysis": {
    "matchingKeywords": [
      {
        "keyword": "<string>",
        "foundIn": "cv" | "both",
        "importance": "high" | "medium" | "low"
      }
    ],
    "missingKeywords": [
      {
        "keyword": "<string>",
        "importance": "high" | "medium" | "low",
        "suggestion": "<how to add this keyword naturally>"
      }
    ]
  },
  "sections": [
    {
      "name": "<section name like 'Experience', 'Skills', 'Education'>",
      "score": <number 0-100>,
      "feedback": "<brief feedback>",
      "improvements": ["<improvement 1>", "<improvement 2>"]
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "recommendations": [
    {
      "priority": "high" | "medium" | "low",
      "category": "<Experience|Skills|Education|Format|Keywords|Other>",
      "suggestion": "<specific actionable suggestion>",
      "example": "<optional example of how to implement>"
    }
  ],
  "atsCompatibility": {
    "score": <number 0-100>,
    "issues": ["<issue 1>", "<issue 2>"],
    "suggestions": ["<suggestion 1>", "<suggestion 2>"]
  }
}

Scoring Guidelines:
- 90-100: Excellent match, highly likely to pass ATS and impress recruiters
- 75-89: Good match, some improvements needed
- 60-74: Fair match, significant improvements recommended
- Below 60: Poor match, major revisions needed

Focus on:
1. Hard skills and technical keywords from job description
2. Soft skills mentioned in job requirements
3. Industry-specific terminology
4. Action verbs and quantifiable achievements
5. ATS-friendly formatting
6. Relevance of experience to the role

Return ONLY valid JSON, no other text.`

  const userPrompt = `Analyze this CV against the job description:

=== CV TEXT ===
${cvContentForAnalysis}

=== JOB DETAILS ===
Company: ${jobContext.company || 'Not specified'}
Role: ${jobContext.role || 'Not specified'}

Job Description:
${jobContext.description || 'No job description provided'}

Provide a comprehensive analysis in JSON format:`

  try {
    const response = await callLLM(config, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ])

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse analysis: No JSON in response')
    }

    const analysisResult: CVAnalysisResult = JSON.parse(jsonMatch[0])
    return { success: true, data: analysisResult }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze CV',
    }
  }
}

// AI Fill Page - analyze all form fields on a page and suggest values
export async function fillPageWithAI(
  config: LLMClientConfig,
  payload: AIFillPagePayload
): Promise<LLMResponse<AIFillPageResult>> {
  const { pageFields, cvData, jobContext } = payload

  if (!pageFields || pageFields.length === 0) {
    return { success: false, error: 'No form fields found on the page' }
  }

  const systemPrompt = `You are an expert form filler assistant. Given a list of form fields and user information, determine the best value to fill in each field.

You will receive:
1. A list of form fields with their labels, types, and current values
2. User's CV/resume data (if available)
3. Job context information (if available)

For each field, determine the most appropriate value based on the user's data. If you cannot determine a value, leave it as null.

Return ONLY valid JSON matching this exact structure:
{
  "filledFields": [
    {
      "selector": "<the selector from the input>",
      "value": "<the value to fill, or null if unknown>"
    }
  ]
}

Guidelines:
- For name fields, use the user's name from CV data
- For email fields, use the user's email
- For phone fields, use the user's phone number
- For address fields, use the user's address information
- For dropdown/select fields, choose the best matching option from the available options
- For yes/no or checkbox fields, make reasonable assumptions based on context
- If a field asks about experience or skills, reference the CV data
- Be conservative - only fill fields you're confident about
- Return null for fields you cannot determine

Return ONLY the JSON, no other text.`

  // Build the field descriptions
  const fieldDescriptions = pageFields.map((field, index) => {
    let desc = `Field ${index + 1}:
  - Selector: ${field.selector}
  - Label: ${field.label || 'No label'}
  - Type: ${field.type} (${field.tagName})
  - Current Value: ${field.currentValue || 'empty'}`
    
    if (field.options && field.options.length > 0) {
      desc += `\n  - Options: ${field.options.join(', ')}`
    }
    
    return desc
  }).join('\n\n')

  let userPrompt = `Fill these form fields with appropriate values:\n\n${fieldDescriptions}`

  if (cvData) {
    userPrompt += `\n\n=== USER CV DATA ===\n${JSON.stringify(cvData, null, 2)}`
  }

  if (jobContext) {
    userPrompt += `\n\n=== JOB CONTEXT ===
Company: ${jobContext.company || 'Not specified'}
Role: ${jobContext.role || 'Not specified'}
Description: ${jobContext.description || 'Not provided'}`
  }

  userPrompt += '\n\nProvide the values to fill in each field as JSON:'

  try {
    const response = await callLLM(config, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ])

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response: No JSON in response')
    }

    const result: AIFillPageResult = JSON.parse(jsonMatch[0])
    
    // Filter out null values
    result.filledFields = result.filledFields.filter(f => f.value !== null && f.value !== undefined)
    
    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fill page with AI',
    }
  }
}
