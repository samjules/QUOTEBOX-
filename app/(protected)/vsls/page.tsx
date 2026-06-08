'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { VSL } from '@/lib/types'

const BUCKET = 'vsls'
const MAX_FILE_SIZE_MB = 500
const VSL_LIMITS: Record<string, number> = { starter: 1, growth: Infinity, fully_managed: Infinity, pay_per_lead: Infinity }

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

function isImageFile(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif'].includes(ext)
}

export default function VSLsPage() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [vsls, setVsls] = useState<VSL[]>([])
  const [plan, setPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [accountId, setAccountId] = useState<string | null>(null)

  // Upload title modal
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [titleInput, setTitleInput] = useState('')

  // Media library lightbox
  const [showLibrary, setShowLibrary] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    loadVSLs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadVSLs() {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!account) {
      setError('Account not found.')
      setLoading(false)
      return
    }

    setAccountId(account.id)

    const { data: billing } = await supabase
      .from('billing')
      .select('plan')
      .eq('account_id', account.id)
      .single()
    setPlan(billing?.plan ?? null)

    const { data, error: fetchError } = await supabase
      .from('vsls')
      .select('*')
      .eq('account_id', account.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError('Failed to load media.')
    } else {
      setVsls(data || [])
    }

    setLoading(false)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const vslLimit = VSL_LIMITS[plan ?? 'starter'] ?? 1
    if (vsls.length >= vslLimit) {
      setError(`Your ${plan === 'starter' ? 'Starter' : 'current'} plan allows ${vslLimit} file${vslLimit !== 1 ? 's' : ''}. Upgrade to upload more.`)
      e.target.value = ''
      return
    }

    if (!file.type.startsWith('video/') && !file.type.startsWith('image/')) {
      setError('Please select a video or image file.')
      return
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_FILE_SIZE_MB} MB.`)
      return
    }

    setError('')
    setPendingFile(file)
    setTitleInput(file.name.replace(/\.[^/.]+$/, ''))
    setShowUploadModal(true)
    e.target.value = ''
  }

  async function handleUpload() {
    if (!pendingFile || !accountId || !titleInput.trim()) return

    setUploading(true)
    setUploadProgress(0)
    setError('')
    setSuccess('')
    setShowUploadModal(false)

    const ext = pendingFile.name.split('.').pop()
    const storagePath = `${accountId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, pendingFile, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`)
      setUploading(false)
      return
    }

    setUploadProgress(80)

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
    const fileUrl = urlData.publicUrl

    const { error: dbError } = await supabase.from('vsls').insert({
      account_id: accountId,
      title: titleInput.trim(),
      file_name: pendingFile.name,
      file_url: fileUrl,
      storage_path: storagePath,
      file_size: pendingFile.size,
    })

    if (dbError) {
      setError(`Failed to save record: ${dbError.message}`)
      await supabase.storage.from(BUCKET).remove([storagePath])
      setUploading(false)
      return
    }

    setUploadProgress(100)
    setSuccess('File uploaded successfully.')
    setPendingFile(null)
    setTitleInput('')
    setUploading(false)
    await loadVSLs()
    setTimeout(() => setSuccess(''), 3000)
  }

  async function handleDelete(vsl: VSL) {
    if (!confirm(`Delete "${vsl.title}"? This cannot be undone.`)) return
    setDeletingId(vsl.id)
    setError('')

    const { error: storageError } = await supabase.storage.from(BUCKET).remove([vsl.storage_path])
    if (storageError) {
      setError(`Failed to delete file: ${storageError.message}`)
      setDeletingId(null)
      return
    }

    const { error: dbError } = await supabase.from('vsls').delete().eq('id', vsl.id)
    if (dbError) {
      setError(`Failed to delete record: ${dbError.message}`)
    } else {
      setVsls((prev) => prev.filter((v) => v.id !== vsl.id))
    }
    setDeletingId(null)
  }

  function copyUrl(url: string, id: string) {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setSuccess('URL copied to clipboard.')
    setTimeout(() => { setSuccess(''); setCopiedId(null) }, 2500)
  }

  const atLimit = plan !== null && vsls.length >= (VSL_LIMITS[plan ?? 'starter'] ?? 1)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Upload and manage your images and videos for Meta Ads campaigns.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {plan && VSL_LIMITS[plan] !== Infinity && (
            <span className="text-sm text-gray-500">
              {vsls.length} / {VSL_LIMITS[plan]} file{VSL_LIMITS[plan] !== 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || atLimit}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium py-2.5 px-4 rounded-xl transition text-sm border border-gray-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload
          </button>
          <button
            onClick={() => setShowLibrary(true)}
            disabled={uploading}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-xl transition text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            {uploading ? 'Uploading…' : 'Media Library'}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Feedback banners */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5 text-sm text-green-700">{success}</div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Uploading…</p>
            <span className="text-sm text-gray-400">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-brand-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        </div>
      )}

      {/* Empty state */}
      {!loading && vsls.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-50 mb-4">
            <svg className="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No media yet</h3>
          <p className="text-sm text-gray-500 mb-5">Upload an image or video to use it in your Meta Ads campaigns.</p>
          <button
            onClick={() => setShowLibrary(true)}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 px-5 rounded-xl transition text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Open Media Library
          </button>
        </div>
      )}

      {/* Media list */}
      {!loading && vsls.length > 0 && (
        <div className="space-y-3">
          {vsls.map((vsl) => (
            <div key={vsl.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              {/* Thumbnail */}
              <div className="flex-shrink-0 w-16 h-12 bg-gray-100 rounded-lg overflow-hidden relative flex items-center justify-center">
                {isImageFile(vsl.file_name) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={vsl.file_url} alt={vsl.title} className="w-full h-full object-cover" />
                ) : (
                  <>
                    <video src={vsl.file_url} className="w-full h-full object-cover" muted preload="metadata"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none' }} />
                    <svg className="w-6 h-6 text-gray-400 absolute" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{vsl.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {vsl.file_name} · {formatBytes(vsl.file_size)} · {formatDate(vsl.created_at)}
                </p>
                <p className="text-xs text-gray-300 mt-0.5 font-mono">{vsl.id}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => copyUrl(vsl.file_url, vsl.id)} title="Copy URL"
                  className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition">
                  {copiedId === vsl.id ? (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
                <a href={vsl.file_url} target="_blank" rel="noopener noreferrer" title="Preview"
                  className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <button onClick={() => handleDelete(vsl)} disabled={deletingId === vsl.id} title="Delete"
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50">
                  {deletingId === vsl.id ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-300 border-t-transparent" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info callout */}
      <div className="mt-8 bg-brand-50 border border-brand-100 rounded-xl p-4 text-sm text-brand-700 flex gap-3">
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <strong>How to use media in Meta Ads:</strong> When creating a campaign, go to{' '}
          <strong>Step 3 (Business Info)</strong> and select a creative from the dropdown.
        </div>
      </div>

      {/* ── MEDIA LIBRARY LIGHTBOX ── */}
      {showLibrary && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.72)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowLibrary(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Media Library</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {vsls.length} file{vsls.length !== 1 ? 's' : ''} uploaded
                </p>
              </div>
              <div className="flex items-center gap-3">
                {!atLimit && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload New
                  </button>
                )}
                <button
                  onClick={() => setShowLibrary(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Grid body */}
            <div className="overflow-y-auto flex-1 p-6">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
                </div>
              ) : vsls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm mb-4">No media uploaded yet.</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2.5 px-5 rounded-xl transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Upload your first file
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {vsls.map((vsl) => (
                    <div
                      key={vsl.id}
                      className="group rounded-xl border border-gray-100 bg-gray-50 overflow-hidden hover:border-brand-300 hover:shadow-md transition-all"
                    >
                      {/* Thumbnail */}
                      <div className="w-full aspect-video bg-gray-200 relative overflow-hidden">
                        {isImageFile(vsl.file_name) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={vsl.file_url}
                            alt={vsl.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => copyUrl(vsl.file_url, vsl.id)}
                            title="Copy URL"
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition"
                          >
                            {copiedId === vsl.id ? (
                              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                          <a href={vsl.file_url} target="_blank" rel="noopener noreferrer" title="Open"
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                          <button onClick={() => handleDelete(vsl)} title="Delete"
                            className="p-2 bg-white/20 hover:bg-red-500/70 rounded-lg backdrop-blur-sm transition">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Label */}
                      <div className="px-3 py-2">
                        <p className="text-sm font-medium text-gray-800 truncate">{vsl.title}</p>
                        <p className="text-xs text-gray-400 font-mono truncate mt-0.5">{vsl.id}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatBytes(vsl.file_size)} · {formatDate(vsl.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload title modal */}
      {showUploadModal && pendingFile && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Name your file</h2>
            <p className="text-sm text-gray-500 mb-4">Give it a recognizable title so you can find it easily.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                autoFocus
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && titleInput.trim() && handleUpload()}
                placeholder="e.g. Summer Roofing Promo 2025"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2 mb-5 text-xs text-gray-500 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {pendingFile.name} · {formatBytes(pendingFile.size)}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowUploadModal(false); setPendingFile(null); setTitleInput('') }}
                className="flex-1 text-gray-600 font-medium py-2.5 px-4 rounded-xl border border-gray-200 hover:border-gray-300 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!titleInput.trim()}
                className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-xl transition text-sm"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
