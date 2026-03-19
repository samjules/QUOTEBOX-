/**
 * lib/ai/claude.ts
 * Claude API integration for teleprompter script generation.
 * Server-side only — never import this in client components.
 */

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export interface ScriptInput {
  business: string
  offer: string
  audience: string
}

export interface GeneratedScript {
  hook: string
  lines: string[]
  cta: string
}

// ----------------------------------------------------------------
// Script generation
// ----------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert video sales letter (VSL) copywriter.
Your scripts are crafted specifically for teleprompter delivery:
- Short, punchy lines (7 words max per line)
- Conversational, spoken language — not written prose
- No jargon, no filler sentences
- Each line reads naturally when spoken aloud
- Optimised for 60–90 second delivery`

const USER_PROMPT = (input: ScriptInput) => `
Write a teleprompter script for the following:

Business: ${input.business}
Offer: ${input.offer}
Target Audience: ${input.audience}

Requirements:
- hook: Single, bold opening line that stops the scroll (max 10 words)
- lines: 15–25 short spoken lines that build desire and overcome objections
- cta: Single clear call-to-action line

Respond ONLY with valid JSON. No markdown, no explanations. Exact format:
{
  "hook": "...",
  "lines": ["...", "...", "..."],
  "cta": "..."
}
`.trim()

export async function generateScript(input: ScriptInput): Promise<GeneratedScript> {
  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: USER_PROMPT(input) },
    ],
  })

  const block = message.content[0]
  if (block.type !== 'text') {
    throw new Error('Unexpected Claude response type')
  }

  // Strip accidental markdown code fences if present
  const raw = block.text.replace(/```(?:json)?\n?/g, '').trim()

  let parsed: GeneratedScript
  try {
    parsed = JSON.parse(raw) as GeneratedScript
  } catch {
    throw new Error(`Claude returned invalid JSON: ${raw.slice(0, 200)}`)
  }

  if (!parsed.hook || !Array.isArray(parsed.lines) || !parsed.cta) {
    throw new Error('Claude response missing required fields (hook, lines, cta)')
  }

  return parsed
}
