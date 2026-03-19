/**
 * POST /api/vsl/generate-script
 *
 * Generates a VSL script using Claude and creates a vsl_campaigns record.
 * Called from the iOS app with a Bearer token.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireVslAuth } from '@/lib/vsl/auth'
import Anthropic from '@anthropic-ai/sdk'

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are an expert video sales letter (VSL) copywriter.
Write persuasive, conversational scripts that:
- Open with a strong hook that grabs attention
- Address the target audience's pain points
- Present the offer as the clear solution
- Close with a compelling call-to-action
- Use short, punchy sentences ideal for on-camera delivery
- Sound natural when read aloud, not like marketing copy`

export async function POST(request: NextRequest) {
  const { account, response } = await requireVslAuth(request)
  if (response) return response

  // Parse body
  let body: { business_name?: string; offer?: string; target_audience?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { business_name, offer, target_audience } = body
  if (!business_name || !offer || !target_audience) {
    return NextResponse.json(
      { error: 'Missing required fields: business_name, offer, target_audience' },
      { status: 400 },
    )
  }

  try {
    // Generate script with Claude
    const message = await claude.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Write a video sales letter script for:

Business: ${business_name}
Offer: ${offer}
Target Audience: ${target_audience}

Write the full script as a single block of text, ready to read from a teleprompter.
Also generate a short, catchy title for this VSL.

Respond ONLY with valid JSON, no markdown:
{
  "title": "...",
  "script": "...(the full script text)..."
}`,
        },
      ],
    })

    const block = message.content[0]
    if (block.type !== 'text') {
      throw new Error('Unexpected Claude response type')
    }

    const raw = block.text.replace(/```(?:json)?\n?/g, '').trim()
    const parsed = JSON.parse(raw) as { title: string; script: string }

    if (!parsed.title || !parsed.script) {
      throw new Error('Claude response missing title or script')
    }

    // Estimate duration: ~150 words per minute
    const wordCount = parsed.script.split(/\s+/).length
    const estimatedDuration = Math.round((wordCount / 150) * 60)

    // Create campaign record
    const admin = createAdminClient()
    const { data: campaign, error: insertError } = await admin
      .from('vsl_campaigns')
      .insert({
        account_id: account.id,
        title: parsed.title,
        status: 'pending',
        script_text: parsed.script,
      })
      .select('id')
      .single()

    if (insertError || !campaign) {
      console.error('[/api/vsl/generate-script] insert failed:', insertError)
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
    }

    return NextResponse.json({
      script: {
        id: campaign.id,
        title: parsed.title,
        script: parsed.script,
        estimated_duration: estimatedDuration,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Script generation failed'
    console.error('[/api/vsl/generate-script] error:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
