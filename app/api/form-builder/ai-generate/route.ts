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

  let body: { businessDescription: string; businessName: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { businessDescription, businessName } = body
  if (!businessDescription?.trim() || !businessName?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 500 })
  }

  const prompt = `You are a quote form builder expert for QUOTEBOX, a quoting platform for service businesses.

Business Name: ${businessName}
Business Description: ${businessDescription}

Create a professional quote form for this business. Return ONLY valid JSON — no markdown, no code blocks, no explanation.

The JSON must match this structure exactly:
{
  "description": "1-2 sentence description shown at the top of the form",
  "submit_label": "CTA button text (e.g. Get My Quote, Request a Quote, Get Instant Price)",
  "fields": [ ...3 to 6 FormField objects... ]
}

Each FormField must have: id (string like "field_1"), type, label, required (boolean).

Available field types and their extra properties:
- "radio": Multiple choice with one selection. Use for service packages or tiers. Add: "options": [{"id":"o1","label":"...","price":0}, ...]
- "dropdown": Select menu. Use for property size, frequency, number of rooms. Add: "options": [{"id":"o1","label":"...","price":0}, ...]
- "checkbox": Multi-select add-ons. Use for optional extras. Add: "options": [{"id":"o1","label":"...","price":0}, ...]
- "number": Quantity with per-unit rate. Use for square footage, hours, rooms. Add: "placeholder": "e.g. 1", "ratePerUnit": 0
- "textarea": Long text, no pricing. Use for special requests or project details. Add: "placeholder": "Tell us more..."

Rules:
- Always start with 1 radio or dropdown field for the main service/package
- Add 2-4 more fields relevant to the business type
- Set realistic prices on options based on the industry (don't use all zeros)
- required=true for the main service field, false for add-ons and textarea
- Keep labels short and professional

Return ONLY the JSON object.`

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
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const anthropicData = await anthropicRes.json()

    if (!anthropicRes.ok) {
      return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
    }

    const rawText: string = anthropicData.content?.[0]?.text || ''

    let formConfig
    try {
      formConfig = JSON.parse(rawText)
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        formConfig = JSON.parse(jsonMatch[0])
      } else {
        return NextResponse.json({ error: 'Invalid AI response format' }, { status: 500 })
      }
    }

    return NextResponse.json({ formConfig })
  } catch {
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }
}
