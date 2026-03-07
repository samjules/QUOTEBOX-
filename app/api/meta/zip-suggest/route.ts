import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

  let body: { description: string; country: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { description, country } = body
  if (!description?.trim()) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 500 })
  }

  const prompt = `You are a geographic expert helping target Meta ads to a specific service area.

User's service area description: "${description.trim()}"
Target country code: ${country}

Return a JSON object containing an array of real, accurate zip/postal codes that cover the described area.

Rules:
- Use ONLY real, valid zip/postal codes
- Format each code as COUNTRY:CODE (e.g. US:90210, CA:M5V2T6, GB:SW1A)
- Include all codes that reasonably cover the described area (up to 50)
- No duplicates
- Raw JSON only — no markdown, no explanation

Return format:
{"postalCodes":["${country}:XXXXX","${country}:XXXXX"]}`

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
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const anthropicData = await anthropicRes.json()
    if (!anthropicRes.ok) {
      return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
    }

    const rawText = anthropicData.content?.[0]?.text || ''

    let parsed: { postalCodes: string[] }
    try {
      parsed = JSON.parse(rawText)
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        return NextResponse.json({ error: 'Invalid AI response format' }, { status: 500 })
      }
    }

    return NextResponse.json({ postalCodes: parsed.postalCodes || [] })
  } catch {
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }
}
