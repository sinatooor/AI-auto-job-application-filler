import { ExtractedCVData, LLMProvider, LLMResponse, LLMSuggestFieldPayload } from '@src/contentScript/utils/storage/LLMTypes'

interface LLMClientConfig {
  provider: LLMProvider
  apiKey: string
  model: string
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
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
export async function processCV(config: LLMClientConfig, cvText: string): Promise<LLMResponse<ExtractedCVData>> {
  const systemPrompt = `You are an expert CV/Resume parser. Extract structured information from the provided CV text.
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

  try {
    const response = await callLLM(config, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Parse this CV:\n\n${cvText}` }
    ])

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
