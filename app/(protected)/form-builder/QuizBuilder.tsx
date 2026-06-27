'use client'

import { useState, useCallback, useRef } from 'react'
import type { QuizConfig, QuizNode, QuizAnswer, QuizResult } from '@/lib/types'

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function makeNode(): QuizNode {
  return {
    id: `node_${uid()}`,
    question: '',
    answers: [
      { id: uid(), label: '', next: '' },
      { id: uid(), label: '', next: '' },
    ],
  }
}

function makeResult(): QuizResult {
  return {
    id: uid(),
    headline: '',
    body: '',
    discount: '',
    cta_label: 'Book My Free Estimate →',
  }
}

export function makeDefaultQuizConfig(): QuizConfig {
  const node = makeNode()
  const result = makeResult()
  result.headline = 'Great news!'
  result.body = 'Based on your answers, we recommend booking a free estimate.'
  result.discount = '10% off your first service'
  node.question = 'What problem are you trying to solve?'
  node.answers = [
    { id: uid(), label: 'High energy bills', next: `result_${result.id}` },
    { id: uid(), label: 'Heat / glare issues', next: `result_${result.id}` },
  ]

  return {
    start: node.id,
    nodes: { [node.id]: node },
    results: { [result.id]: result },
  }
}

export default function QuizBuilder({
  config,
  onChange,
  brandColor,
  onUploadImage,
}: {
  config: QuizConfig
  onChange: (c: QuizConfig) => void
  brandColor: string
  onUploadImage?: (file: File) => Promise<string>
}) {
  const [selectedId, setSelectedId] = useState<string>(config.start)
  const [imageUploading, setImageUploading] = useState(false)
  const imageFileRef = useRef<HTMLInputElement>(null)

  const nodeIds = Object.keys(config.nodes)
  const resultIds = Object.keys(config.results)
  const allDestinations = [
    ...nodeIds.map(id => ({ value: id, label: `Q: ${config.nodes[id].question || '(no question)'}`.slice(0, 48) })),
    ...resultIds.map(id => ({ value: `result_${id}`, label: `Result: ${config.results[id].headline || '(no headline)'}`.slice(0, 48) })),
  ]

  const addNode = useCallback(() => {
    const n = makeNode()
    onChange({ ...config, nodes: { ...config.nodes, [n.id]: n } })
    setSelectedId(n.id)
  }, [config, onChange])

  const addResult = useCallback(() => {
    const r = makeResult()
    onChange({ ...config, results: { ...config.results, [r.id]: r } })
    setSelectedId(`result_${r.id}`)
  }, [config, onChange])

  const deleteNode = useCallback((id: string) => {
    if (nodeIds.length <= 1) return
    const { [id]: _, ...rest } = config.nodes
    const newStart = id === config.start ? (nodeIds.find(i => i !== id) ?? '') : config.start
    onChange({ ...config, nodes: rest, start: newStart })
    if (selectedId === id) setSelectedId(newStart)
  }, [config, onChange, nodeIds, selectedId])

  const deleteResult = useCallback((id: string) => {
    const { [id]: _, ...rest } = config.results
    onChange({ ...config, results: rest })
    if (selectedId === `result_${id}`) setSelectedId(config.start)
  }, [config, onChange, selectedId])

  const updateNode = useCallback((id: string, updates: Partial<QuizNode>) => {
    onChange({ ...config, nodes: { ...config.nodes, [id]: { ...config.nodes[id], ...updates } } })
  }, [config, onChange])

  const updateAnswer = useCallback((nodeId: string, answerId: string, updates: Partial<QuizAnswer>) => {
    const node = config.nodes[nodeId]
    onChange({
      ...config,
      nodes: {
        ...config.nodes,
        [nodeId]: {
          ...node,
          answers: node.answers.map(a => a.id === answerId ? { ...a, ...updates } : a),
        },
      },
    })
  }, [config, onChange])

  const addAnswer = useCallback((nodeId: string) => {
    const node = config.nodes[nodeId]
    if (node.answers.length >= 4) return
    onChange({
      ...config,
      nodes: {
        ...config.nodes,
        [nodeId]: { ...node, answers: [...node.answers, { id: uid(), label: '', next: '' }] },
      },
    })
  }, [config, onChange])

  const removeAnswer = useCallback((nodeId: string, answerId: string) => {
    const node = config.nodes[nodeId]
    if (node.answers.length <= 1) return
    onChange({
      ...config,
      nodes: {
        ...config.nodes,
        [nodeId]: { ...node, answers: node.answers.filter(a => a.id !== answerId) },
      },
    })
  }, [config, onChange])

  const updateResult = useCallback((id: string, updates: Partial<QuizResult>) => {
    onChange({ ...config, results: { ...config.results, [id]: { ...config.results[id], ...updates } } })
  }, [config, onChange])

  async function handleImageFile(resultId: string, file: File) {
    if (!onUploadImage) return
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext) || file.size > 5 * 1024 * 1024) return
    setImageUploading(true)
    try {
      const url = await onUploadImage(file)
      updateResult(resultId, { image_url: url })
    } finally {
      setImageUploading(false)
    }
  }

  const accent = brandColor || '#FFE500'
  const selectedNode = selectedId && !selectedId.startsWith('result_') ? config.nodes[selectedId] : null
  const selectedResultId = selectedId.startsWith('result_') ? selectedId.replace('result_', '') : null
  const selectedResult = selectedResultId ? config.results[selectedResultId] : null

  return (
    <div style={{ display: 'flex', gap: 0, height: '100%', minHeight: 500 }}>
      {/* Left: node list */}
      <div style={{ width: 220, borderRight: '1px solid #e2e8f0', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Questions</div>
        {nodeIds.map(id => {
          const node = config.nodes[id]
          const isSel = selectedId === id
          const isStart = id === config.start
          return (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => setSelectedId(id)}
                style={{
                  flex: 1, textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${isSel ? accent : '#e2e8f0'}`,
                  background: isSel ? `${accent}18` : '#fff', fontSize: '0.8rem', fontWeight: isSel ? 700 : 500,
                  color: isSel ? '#0f172a' : '#475569', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
                {isStart ? '⭐ ' : ''}{node.question || '(no question)'}
              </button>
              {!isStart && nodeIds.length > 1 && (
                <button onClick={() => deleteNode(id)} style={{ padding: '4px 6px', background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: '0.8rem' }} title="Delete">✕</button>
              )}
            </div>
          )
        })}
        <button
          onClick={addNode}
          style={{ marginTop: 4, padding: '8px 10px', borderRadius: 8, border: '1.5px dashed #cbd5e1', background: 'none', fontSize: '0.8rem', color: '#64748b', cursor: 'pointer', textAlign: 'left' }}
        >
          + Add question
        </button>

        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 16, marginBottom: 4 }}>Results</div>
        {resultIds.map(id => {
          const result = config.results[id]
          const key = `result_${id}`
          const isSel = selectedId === key
          return (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => setSelectedId(key)}
                style={{
                  flex: 1, textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${isSel ? '#22c55e' : '#e2e8f0'}`,
                  background: isSel ? '#f0fdf4' : '#fff', fontSize: '0.8rem', fontWeight: isSel ? 700 : 500,
                  color: isSel ? '#166534' : '#475569', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
                ✓ {result.headline || '(no headline)'}
              </button>
              {resultIds.length > 1 && (
                <button onClick={() => deleteResult(id)} style={{ padding: '4px 6px', background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: '0.8rem' }} title="Delete">✕</button>
              )}
            </div>
          )
        })}
        <button
          onClick={addResult}
          style={{ marginTop: 4, padding: '8px 10px', borderRadius: 8, border: '1.5px dashed #cbd5e1', background: 'none', fontSize: '0.8rem', color: '#64748b', cursor: 'pointer', textAlign: 'left' }}
        >
          + Add result
        </button>
      </div>

      {/* Right: editor */}
      <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
        {selectedNode && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Question</div>
              {selectedId !== config.start && (
                <button
                  onClick={() => onChange({ ...config, start: selectedId })}
                  style={{ fontSize: '0.72rem', padding: '3px 8px', background: `${accent}20`, border: `1px solid ${accent}60`, borderRadius: 6, cursor: 'pointer', color: '#0f172a' }}
                >
                  Set as first question
                </button>
              )}
              {selectedId === config.start && (
                <span style={{ fontSize: '0.72rem', padding: '3px 8px', background: '#f1f5f9', borderRadius: 6, color: '#64748b' }}>First question</span>
              )}
            </div>

            <div className="fm" style={{ marginBottom: 24 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Question text</label>
              <input
                type="text"
                value={selectedNode.question}
                onChange={e => updateNode(selectedId, { question: e.target.value })}
                placeholder="e.g. What problem are you trying to solve?"
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 12 }}>Answer options (up to 4)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {selectedNode.answers.map((answer, idx) => (
                <div key={answer.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', flexShrink: 0, marginTop: 10 }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input
                      type="text"
                      value={answer.label}
                      onChange={e => updateAnswer(selectedId, answer.id, { label: e.target.value })}
                      placeholder={`Answer ${idx + 1}`}
                      style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <select
                      value={answer.next}
                      onChange={e => updateAnswer(selectedId, answer.id, { next: e.target.value })}
                      style={{ width: '100%', padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.8rem', outline: 'none', background: '#fff', color: answer.next ? '#0f172a' : '#94a3b8' }}
                    >
                      <option value="">→ leads to…</option>
                      <optgroup label="Questions">
                        {nodeIds.filter(id => id !== selectedId).map(id => (
                          <option key={id} value={id}>{config.nodes[id].question || '(no question)'}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Results">
                        {resultIds.map(id => (
                          <option key={id} value={`result_${id}`}>{config.results[id].headline || '(no headline)'}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  {selectedNode.answers.length > 1 && (
                    <button
                      onClick={() => removeAnswer(selectedId, answer.id)}
                      style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: '1rem', marginTop: 4 }}
                      title="Remove answer"
                    >✕</button>
                  )}
                </div>
              ))}
            </div>
            {selectedNode.answers.length < 4 && (
              <button
                onClick={() => addAnswer(selectedId)}
                style={{ marginTop: 12, padding: '8px 14px', borderRadius: 8, border: '1.5px dashed #cbd5e1', background: 'none', fontSize: '0.8rem', color: '#64748b', cursor: 'pointer' }}
              >
                + Add answer
              </button>
            )}
          </div>
        )}

        {selectedResult && selectedResultId && (
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Result card</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {onUploadImage && (
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Card image <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span>
                  </label>
                  <input
                    ref={imageFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) handleImageFile(selectedResultId, f)
                      e.target.value = ''
                    }}
                  />
                  {selectedResult.image_url ? (
                    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selectedResult.image_url} alt="Card" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                      <div style={{ display: 'flex', gap: 6, padding: '7px 10px', background: '#f8fafc' }}>
                        <button
                          onClick={() => imageFileRef.current?.click()}
                          disabled={imageUploading}
                          style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.75rem', cursor: 'pointer', color: '#374151' }}
                        >
                          Change
                        </button>
                        <button
                          onClick={() => updateResult(selectedResultId, { image_url: '' })}
                          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.75rem', cursor: 'pointer', color: '#94a3b8' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => imageFileRef.current?.click()}
                      disabled={imageUploading}
                      style={{ display: 'block', width: '100%', padding: '28px 16px', borderRadius: 10, border: '1.5px dashed #cbd5e1', background: '#f8fafc', cursor: imageUploading ? 'wait' : 'pointer', textAlign: 'center' as const, boxSizing: 'border-box' }}
                    >
                      {imageUploading ? (
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Uploading…</div>
                      ) : (
                        <>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#374151', marginBottom: 3 }}>Upload an image</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>JPG, PNG or WebP — max 5 MB</div>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Headline</label>
                <input
                  type="text"
                  value={selectedResult.headline}
                  onChange={e => updateResult(selectedResultId, { headline: e.target.value })}
                  placeholder="e.g. Great news! We can help."
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Body text</label>
                <textarea
                  rows={3}
                  value={selectedResult.body}
                  onChange={e => updateResult(selectedResultId, { body: e.target.value })}
                  placeholder="Explain the recommendation or outcome…"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5 }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Discount offer <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span></label>
                <input
                  type="text"
                  value={selectedResult.discount}
                  onChange={e => updateResult(selectedResultId, { discount: e.target.value })}
                  placeholder="e.g. 10% off your first service"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>CTA button label</label>
                <input
                  type="text"
                  value={selectedResult.cta_label}
                  onChange={e => updateResult(selectedResultId, { cta_label: e.target.value })}
                  placeholder="Book My Free Estimate →"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Preview */}
            <div style={{ marginTop: 28, padding: '20px', background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Preview</div>
              <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                {selectedResult.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedResult.image_url} alt="Card" style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }} />
                )}
                <div style={{ padding: '20px' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', marginBottom: 8 }}>{selectedResult.headline || '(headline)'}</div>
                  <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6, marginBottom: selectedResult.discount ? 14 : 16 }}>{selectedResult.body || '(body text)'}</div>
                  {selectedResult.discount && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${accent}18`, border: `1.5px solid ${accent}50`, borderRadius: 8, padding: '7px 12px', marginBottom: 14 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{selectedResult.discount}</span>
                    </div>
                  )}
                  <div style={{ padding: '10px', background: accent, borderRadius: 8, textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                    {selectedResult.cta_label || 'Book My Free Estimate →'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!selectedNode && !selectedResult && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#94a3b8', fontSize: '0.85rem' }}>
            Select a question or result to edit
          </div>
        )}
      </div>
    </div>
  )
}
