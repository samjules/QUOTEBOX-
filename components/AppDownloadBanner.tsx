'use client'

import { QRCodeSVG } from 'qrcode.react'

const APPLE_URL = 'https://apps.apple.com/us/app/quote-box-lead-machine/id6761129794'

export default function AppDownloadBanner() {
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
        <QRCodeSVG value={APPLE_URL} size={72} level="M" />
      </div>

      {/* Text */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#0e0020', lineHeight: 1.3, marginBottom: 4 }}>
          <svg width="10" height="12" viewBox="0 0 814 1000" fill="currentColor">
            <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.3-150.3-110.7c-67.5-98.2-120-252.6-120-398.7 0-138.9 48.4-207.5 96.8-253.5 57.3-54.5 138.4-86.1 213.3-86.1 81.6 0 132.2 39.5 189.5 39.5 55.4 0 115.7-42.3 207.8-42.3zm-156.5-252c32.5-50 56.7-119 56.7-188C688.3 24.6 549.8 0 476.5 0c-2 0-4 0-6.1.1-2.3 30.5-1.2 96 22.7 158.6 23.2 61.5 56.8 99.2 138.4 130.2z" />
          </svg>
          Download the free app
        </div>
        <div style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.4, marginBottom: 5, maxWidth: 160 }}>
          Get push notifications the moment a lead comes in.
        </div>
        <div style={{ fontSize: 9, color: '#9ca3af' }}>
          Scan to open the App Store
        </div>
      </div>
    </div>
  )
}
