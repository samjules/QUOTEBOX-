'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

const APPLE_URL = 'https://apps.apple.com/us/app/quote-box-lead-machine/id6761129794'
const ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.quotebox.leadmachine'

export default function AppDownloadBanner() {
  const [platform, setPlatform] = useState<'apple' | 'android'>('apple')

  const url = platform === 'apple' ? APPLE_URL : ANDROID_URL
  const storeName = platform === 'apple' ? 'App Store' : 'Google Play'

  return (
    <div
      className="hidden lg:flex"
      style={{
        alignItems: 'center',
        gap: 14,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 14,
        padding: '12px 16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        minWidth: 0,
      }}
    >
      {/* QR code */}
      <div style={{
        background: 'white',
        borderRadius: 10,
        padding: 6,
        flexShrink: 0,
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      }}>
        <QRCodeSVG value={url} size={72} level="M" />
      </div>

      {/* Text + toggle */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#0e0020', lineHeight: 1.3, marginBottom: 4 }}>
          Download the free app
        </div>
        <div style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.4, marginBottom: 8, maxWidth: 160 }}>
          Get push notifications the moment a lead comes in.
        </div>

        {/* Toggle */}
        <div style={{
          display: 'flex',
          background: '#f3f4f6',
          borderRadius: 8,
          padding: 2,
          gap: 2,
        }}>
          <button
            onClick={() => setPlatform('apple')}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 10, fontWeight: 600,
              background: platform === 'apple' ? 'white' : 'transparent',
              color: platform === 'apple' ? '#0e0020' : '#9ca3af',
              boxShadow: platform === 'apple' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {/* Apple logo */}
            <svg width="10" height="12" viewBox="0 0 814 1000" fill="currentColor">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.3-150.3-110.7c-67.5-98.2-120-252.6-120-398.7 0-138.9 48.4-207.5 96.8-253.5 57.3-54.5 138.4-86.1 213.3-86.1 81.6 0 132.2 39.5 189.5 39.5 55.4 0 115.7-42.3 207.8-42.3zm-156.5-252c32.5-50 56.7-119 56.7-188C688.3 24.6 549.8 0 476.5 0c-2 0-4 0-6.1.1-2.3 30.5-1.2 96 22.7 158.6 23.2 61.5 56.8 99.2 138.4 130.2z"/>
            </svg>
            iOS
          </button>
          <button
            onClick={() => setPlatform('android')}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 10, fontWeight: 600,
              background: platform === 'android' ? 'white' : 'transparent',
              color: platform === 'android' ? '#0e0020' : '#9ca3af',
              boxShadow: platform === 'android' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {/* Android logo */}
            <svg width="10" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zm-2.5-1C2.67 17 2 17.67 2 18.5v-9C2 8.67 2.67 8 3.5 8S5 8.67 5 9.5v9c0 .83-.67 1.5-1.5 1.5zm17 0c-.83 0-1.5-.67-1.5-1.5v-9c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5zM15.53 2.16l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 1.23 12.95 1 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"/>
            </svg>
            Android
          </button>
        </div>

        <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 5 }}>
          Scan to open {storeName}
        </div>
      </div>
    </div>
  )
}
