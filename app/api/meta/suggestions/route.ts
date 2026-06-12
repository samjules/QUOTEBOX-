import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 500 })

  let body: { campaigns: unknown[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const prompt = `You are a Meta Ads expert analyst. Analyze the following campaign performance data and provide actionable suggestions.

Campaign Data:
${JSON.stringify(body.campaigns, null, 2)}

Respond with raw JSON (no markdown) matching this exact structure:
{
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "topPerformer": "Name of the campaign with the best CPL or 'No data yet' if no insights",
  "actionItems": ["action item 1", "action item 2", "action item 3"]
}

Focus on: budget reallocation opportunities, audience refinements, copy improvements, scaling winners.
If there are no campaigns or no spend data, provide general Meta Ads best practices as suggestions.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
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

    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })

    const rawText = data.content?.[0]?.text || ''
    let parsed
    try {
      parsed = JSON.parse(rawText)
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/)
      if (match) parsed = JSON.parse(match[0])
      else return NextResponse.json({ error: 'Invalid AI response' }, { status: 500 })
    }

    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'AI suggestions failed' }, { status: 500 })
  }
}
