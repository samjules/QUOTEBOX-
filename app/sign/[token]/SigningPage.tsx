'use client'

import { useRef, useState, useEffect } from 'react'

export default function SigningPage({
  token,
  title,
  documentUrl,
  signerName: initialName,
  signerEmail,
  businessName,
  alreadySigned,
}: {
  token: string
  title: string
  documentUrl: string | null
  signerName: string
  signerEmail: string
  businessName: string
  alreadySigned: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mode, setMode] = useState<'draw' | 'type'>('draw')
  const [typedName, setTypedName] = useState(initialName)
  const [signerName, setSignerName] = useState(initialName)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [signed, setSigned] = useState(alreadySigned)
  const [error, setError] = useState('')
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#0e0020'
  }, [])

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    setIsDrawing(true)
    setHasDrawn(true)
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  function endDraw() {
    setIsDrawing(false)
  }

  function getSignatureData(): string | null {
    if (mode === 'draw') {
      const canvas = canvasRef.current
      if (!canvas || !hasDrawn) return null
      return canvas.toDataURL('image/png')
    }
    // Type mode: render text to canvas and export
    if (!typedName.trim()) return null
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 100
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.fillStyle = '#0e0020'
    ctx.font = 'italic 36px "Dancing Script", "Brush Script MT", cursive'
    ctx.fillText(typedName, 20, 60)
    return canvas.toDataURL('image/png')
  }

  async function handleSign() {
    setError('')
    const signatureData = getSignatureData()
    if (!signatureData) {
      setError(mode === 'draw' ? 'Please draw your signature' : 'Please type your name')
      return
    }
    if (!agreed) {
      setError('You must agree to the terms')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/agreements/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          signatureData,
          signerName: mode === 'type' ? typedName : signerName,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to sign')
      setSigned(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign agreement')
    }
    setLoading(false)
  }

  if (signed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Agreement Signed!</h1>
          <p className="text-gray-500">
            Thank you for signing the agreement with {businessName}. A confirmation has been sent to {signerEmail}.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Google Font for cursive signature */}
      <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="bg-[#0e0020] text-white py-6 px-4 text-center">
        <h1 className="text-lg font-bold">{businessName}</h1>
        <p className="text-sm text-gray-300 mt-1">{title}</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Document preview */}
        {documentUrl && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Agreement Document</h2>
            </div>
            <div className="h-[500px]">
              <iframe
                src={documentUrl}
                className="w-full h-full border-0"
                title="Agreement document"
              />
            </div>
          </div>
        )}

        {/* Signer info */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Your Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={signerEmail}
                readOnly
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Signature</h2>

          {/* Mode tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode('draw')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                mode === 'draw'
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Draw
            </button>
            <button
              onClick={() => setMode('type')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                mode === 'type'
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Type
            </button>
          </div>

          {mode === 'draw' ? (
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-xl bg-white relative">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={150}
                  className="w-full cursor-crosshair touch-none"
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={endDraw}
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-gray-300 text-sm">Draw your signature here</p>
                  </div>
                )}
              </div>
              <button
                onClick={clearCanvas}
                className="mt-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
          ) : (
            <div>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Type your full name"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              />
              {typedName && (
                <div className="mt-3 p-4 border border-gray-200 rounded-xl bg-gray-50 text-center">
                  <span
                    style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive", fontSize: '2rem' }}
                    className="text-[#0e0020]"
                  >
                    {typedName}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Agreement checkbox */}
        <div className="bg-white rounded-xl shadow p-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-700">
              I agree that the signature above represents my legal signature and I consent to signing this agreement electronically.
            </span>
          </label>
        </div>

        {error && (
          <p className="text-sm text-red-600 font-medium text-center">{error}</p>
        )}

        <button
          onClick={handleSign}
          disabled={loading || !agreed}
          className="w-full py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing...' : 'Sign Agreement'}
        </button>

        <p className="text-xs text-center text-gray-400">
          By signing, you agree to the terms of this agreement. Your signature, name, email, and IP address will be recorded.
        </p>
      </div>
    </div>
  )
}
