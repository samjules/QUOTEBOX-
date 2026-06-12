import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
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

  let body: { messages: ChatMessage[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { messages } = body
  if (!messages?.length) {
    return NextResponse.json({ error: 'Messages are required' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 500 })
  }

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
        system: `You are Robert, a friendly and sharp Meta advertising expert built into QuoteBox — a lead generation platform. You help business owners create, optimize, and understand their Facebook/Meta ad campaigns.

Your personality: direct, practical, a little witty. You give real advice, not fluff. Keep responses concise (2-4 sentences max unless the question needs more). Use plain language — no jargon unless explaining it.

You know about: campaign objectives, audience targeting, ad copy, budgets, CPL optimization, split testing, the Meta Ads Manager, conversion tracking, pixels, and lead generation best practices.

If asked something outside Meta ads or marketing, politely redirect to what you're good at.`,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    })

    const data = await anthropicRes.json()
    if (!anthropicRes.ok) {
      return NextResponse.json({ error: 'Failed to get response' }, { status: 500 })
    }

    const reply = data.content?.[0]?.text || "I couldn't come up with a response. Try rephrasing?"
    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 })
  }
}
