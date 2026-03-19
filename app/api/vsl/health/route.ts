/**
 * GET /api/vsl/health — test Claude model names to find valid ones
 */

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

async function testModel(model: string, apiKey: string): Promise<string> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say ok' }],
      }),
    })
    const body = await res.json()
    if (res.ok) {
      const text = body.content?.[0]?.text ?? 'no text'
      return `OK: "${text}"`
    }
    return `${res.status}: ${body.error?.message ?? JSON.stringify(body)}`
  } catch (err) {
    return `FETCH ERROR: ${err instanceof Error ? err.message : String(err)}`
  }
}

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY || ''

  const models = [
    'claude-sonnet-4-5-20241022',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-latest',
    'claude-sonnet-4-6',
    'claude-opus-4-6',
  ]

  const results: Record<string, string> = {}
  for (const model of models) {
    results[model] = await testModel(model, apiKey)
  }

  return NextResponse.json(results)
}
