import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'QuoteFlow',
  description: 'Instant quote landing pages for service businesses',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Work+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-50">{children}</body>
    </html>
  )
}
