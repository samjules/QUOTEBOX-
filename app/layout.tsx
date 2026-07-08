import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://quote-box.com'),
  title: {
    default: 'Quotebox — Exclusive Contractor Leads from $15',
    template: '%s | Quotebox',
  },
  description: 'Get exclusive contractor leads from Facebook & Instagram ads. Pay only $15 per lead — no monthly fees, no contracts. Build your quote form in minutes and start getting roofing, HVAC, plumbing, and electrician leads today.',
  keywords: [
    'contractor leads',
    'exclusive contractor leads',
    'buy contractor leads',
    'roofing leads',
    'HVAC leads',
    'plumbing leads',
    'electrician leads',
    'home improvement leads',
    'thumbtack alternative',
    'angi leads alternative',
    'contractor lead generation',
    'pay per lead contractors',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://quote-box.com',
    siteName: 'Quotebox',
    title: 'Quotebox — Exclusive Contractor Leads from $15',
    description: 'Stop sharing leads with 5 competitors. Get exclusive contractor leads from Facebook & Instagram. Pay $15 per lead, no monthly fees.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Quotebox — Exclusive Contractor Leads',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quotebox — Exclusive Contractor Leads from $15',
    description: 'Stop sharing leads with 5 competitors. Get exclusive contractor leads from Facebook & Instagram. Pay $15 per lead.',
    images: ['/og-image.png'],
  },
  // ── Google Search Console ──────────────────────────────────────────────────
  // 1. Go to https://search.google.com/search-console
  // 2. Add property → URL prefix → https://quote-box.com
  // 3. Choose "HTML tag" verification method
  // 4. Copy the content value from the meta tag and paste it below
  verification: {
    google: 'REPLACE_WITH_YOUR_GOOGLE_VERIFICATION_CODE',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://quote-box.com',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Quotebox',
    url: 'https://quote-box.com',
    logo: 'https://quote-box.com/logo.png',
    description: 'Exclusive contractor leads from Facebook & Instagram ads. Pay per lead, no monthly fees.',
    sameAs: [],
  }

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link rel="preload" href="/fonts/Nautic.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </head>
      <body className="bg-gray-50">
        {/* Meta Pixel — quote-box.com site-wide, tracks visitors/signups for our own ad campaigns.
            Separate from the per-account pixel businesses set on their own hosted forms. */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '614817694167232');
          fbq('track', 'PageView');`}
        </Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=614817694167232&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {children}
      </body>
    </html>
  )
}
