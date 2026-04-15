import { GoogleGenerativeAI } from '@google/generative-ai'

type InsightType =
  | 'AT_RISK_CLIENT'
  | 'FOLLOW_UP_REMINDER'
  | 'SUGGESTED_MESSAGE'
  | 'COMPLAINT_ALERT'
  | 'ENGAGEMENT_OPPORTUNITY'
  | 'CHURN_PREDICTION'

type InsightResult = {
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
  insightType: InsightType
  title: string
  description: string
  suggestedAction: string
  confidence: number
  keyPoints: string[]
}

const allowedInsightTypes = new Set<InsightType>([
  'AT_RISK_CLIENT',
  'FOLLOW_UP_REMINDER',
  'SUGGESTED_MESSAGE',
  'COMPLAINT_ALERT',
  'ENGAGEMENT_OPPORTUNITY',
  'CHURN_PREDICTION',
])

function parseJsonObject(text: string): Record<string, any> | null {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    return null
  }

  const candidate = cleaned.slice(start, end + 1)
  try {
    return JSON.parse(candidate)
  } catch {
    return null
  }
}

function clampConfidence(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(parsed)) return 70
  if (parsed < 0) return 0
  if (parsed > 100) return 100
  return Math.round(parsed)
}

function normalizeInsightType(value: unknown, fallback: InsightType): InsightType {
  const type = typeof value === 'string' ? (value.toUpperCase() as InsightType) : fallback
  return allowedInsightTypes.has(type) ? type : fallback
}

function normalizeSentiment(value: unknown): 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' {
  const sentiment = typeof value === 'string' ? value.toUpperCase() : 'NEUTRAL'
  if (sentiment === 'POSITIVE' || sentiment === 'NEGATIVE') return sentiment
  return 'NEUTRAL'
}

export function llmEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY)
}

export async function analyzeClientMessage(input: {
  clientName: string
  message: string
  interactionType: string
  fallbackInsightType: InsightType
}): Promise<InsightResult | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  try {
    const client = new GoogleGenerativeAI(apiKey)
    const model = client.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    })

    const prompt = `
You are a CRM assistant. Analyze the client interaction below and return JSON only.

Rules:
- Return valid JSON object only (no markdown, no comments).
- Use sentiment from: POSITIVE, NEUTRAL, NEGATIVE.
- Use insightType from: AT_RISK_CLIENT, FOLLOW_UP_REMINDER, SUGGESTED_MESSAGE, COMPLAINT_ALERT, ENGAGEMENT_OPPORTUNITY, CHURN_PREDICTION.
- confidence must be integer from 0 to 100.
- keyPoints must be an array of short strings.

Interaction context:
- Client name: ${input.clientName}
- Interaction type: ${input.interactionType}
- Message: ${input.message}

Output schema:
{
  "sentiment": "POSITIVE|NEUTRAL|NEGATIVE",
  "insightType": "AT_RISK_CLIENT|FOLLOW_UP_REMINDER|SUGGESTED_MESSAGE|COMPLAINT_ALERT|ENGAGEMENT_OPPORTUNITY|CHURN_PREDICTION",
  "title": "short title",
  "description": "short summary of risk/opportunity",
  "suggestedAction": "clear next action for team",
  "confidence": 0,
  "keyPoints": ["point 1", "point 2"]
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const parsed = parseJsonObject(text)
    if (!parsed) return null

    const sentiment = normalizeSentiment(parsed.sentiment)
    const insightType = normalizeInsightType(parsed.insightType, input.fallbackInsightType)
    const title = typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : `Client update from ${input.clientName}`
    const description =
      typeof parsed.description === 'string' && parsed.description.trim()
        ? parsed.description.trim()
        : `Interaction update for ${input.clientName}.`
    const suggestedAction =
      typeof parsed.suggestedAction === 'string' && parsed.suggestedAction.trim()
        ? parsed.suggestedAction.trim()
        : `Review the latest ${input.interactionType.toLowerCase()} and follow up with ${input.clientName}.`

    const keyPoints = Array.isArray(parsed.keyPoints)
      ? parsed.keyPoints.filter((item) => typeof item === 'string').slice(0, 5)
      : []

    return {
      sentiment,
      insightType,
      title,
      description,
      suggestedAction,
      confidence: clampConfidence(parsed.confidence),
      keyPoints,
    }
  } catch (error) {
    console.error('Gemini insight generation failed:', error)
    return null
  }
}
