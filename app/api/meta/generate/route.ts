import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface QuestionnaireAnswers {
  objective: string
  targetAge?: { min: number; max: number }
  targetGender?: string
  targetLocation?: string
  targetInterests?: string
  businessOffer?: string
  sellingPoints?: string
  tone?: string
  dailyBudget?: number
  duration?: number | 'ongoing'
}

export async function POST(request: NextRequest) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let answers: QuestionnaireAnswers
  try {
    answers = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 500 })
  }

  const prompt = `You are an expert Facebook/Meta advertising strategist. Based on the following campaign details, generate compelling ad copy and targeting suggestions.

Campaign Details:
- Objective: ${answers.objective}
- Target Age: ${answers.targetAge ? `${answers.targetAge.min}–${answers.targetAge.max}` : 'Not specified'}
- Target Gender: ${answers.targetGender || 'All'}
- Target Location: ${answers.targetLocation || 'Not specified'}
- Target Interests: ${answers.targetInterests || 'Not specified'}
- Business Offer: ${answers.businessOffer || 'Not specified'}
- Key Selling Points: ${answers.sellingPoints || 'Not specified'}
- Ad Tone: ${answers.tone || 'Professional'}
- Daily Budget: $${answers.dailyBudget || 'Not specified'}
- Campaign Duration: ${answers.duration === 'ongoing' ? 'Ongoing' : `${answers.duration} days`}

Generate a JSON response (no markdown, just raw JSON) with this exact structure:
{
  "campaignName": "short punchy campaign name (max 50 chars)",
  "adSetName": "descriptive ad set name (max 50 chars)",
  "headlines": ["headline 1 (max 40 chars)", "headline 2 (max 40 chars)", "headline 3 (max 40 chars)"],
  "bodyTexts": ["body text 1 (max 125 chars, engaging, with implicit CTA)", "body text 2 (max 125 chars)", "body text 3 (max 125 chars)"],
  "cta": "one of: LEARN_MORE, SIGN_UP, GET_QUOTE, CONTACT_US, BOOK_NOW",
  "targetingKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "summary": "1 sentence explaining the campaign strategy"
}`

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    const anthropicData = await anthropicRes.json()

    if (!anthropicRes.ok) {
      return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
    }

    const rawText = anthropicData.content?.[0]?.text || ''

    let generated
    try {
      generated = JSON.parse(rawText)
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        generated = JSON.parse(jsonMatch[0])
      } else {
        return NextResponse.json({ error: 'Invalid AI response format' }, { status: 500 })
      }
    }

    return NextResponse.json(generated)
  } catch {
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }
}
