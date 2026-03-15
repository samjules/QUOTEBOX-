import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/leads',
          '/billing',
          '/settings',
          '/form-builder',
          '/hosted-forms',
          '/analytics',
          '/calendar',
          '/map',
          '/lead-machine',
          '/rewards',
          '/vsls',
          '/admin',
          '/api/',
          '/onboarding',
        ],
      },
    ],
    sitemap: 'https://quote-box.com/sitemap.xml',
  }
}
