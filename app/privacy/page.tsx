export const metadata = {
  title: 'Privacy Policy — QuoteBox',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: March 1, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Overview</h2>
            <p>
              QuoteBox (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the website at quote-box.com and provides
              quote generation, lead capture, and Meta Ads management tools for businesses. This Privacy
              Policy explains what information we collect, how we use it, and your rights regarding
              your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Information We Collect</h2>
            <p className="mb-3"><strong>Account information:</strong> When you sign up, we collect your email address and any business details you provide during onboarding.</p>
            <p className="mb-3"><strong>Lead data:</strong> When visitors fill out your QuoteBox forms, we collect the information they submit (name, email, phone, quote details) and store it on your behalf.</p>
            <p className="mb-3"><strong>Payment information:</strong> Billing is handled by Stripe. We do not store your credit card details. We store your Stripe customer ID and subscription status.</p>
            <p className="mb-3"><strong>Meta / Facebook data:</strong> If you connect a Meta Ads account, we store an access token and ad account ID to create campaigns on your behalf. We do not share this data with third parties.</p>
            <p><strong>Usage data:</strong> We may collect standard server logs including IP addresses, browser types, and pages visited for security and performance purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and operate the QuoteBox platform</li>
              <li>To process payments and manage your subscription</li>
              <li>To create and manage Meta Ads campaigns on your behalf</li>
              <li>To generate AI-powered ad copy using your business details</li>
              <li>To send transactional emails related to your account</li>
              <li>To improve our services and troubleshoot issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Data Storage</h2>
            <p>
              Your data is stored securely using Supabase, which uses PostgreSQL hosted on AWS infrastructure.
              Uploaded files (images, videos) are stored in Supabase Storage. Data is stored in the United States.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Third-Party Services</h2>
            <p className="mb-2">We use the following third-party services:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase</strong> — database and file storage</li>
              <li><strong>Stripe</strong> — payment processing</li>
              <li><strong>Meta (Facebook)</strong> — ad campaign management</li>
              <li><strong>Anthropic</strong> — AI-powered ad copy generation</li>
              <li><strong>Mapbox</strong> — route calculation in quote forms</li>
              <li><strong>Vercel</strong> — application hosting</li>
            </ul>
            <p className="mt-3">Each service operates under its own privacy policy. We only share data with these services as necessary to operate QuoteBox.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active. If you delete your account,
              we will delete your data within 30 days, except where we are required to retain it for legal
              or financial compliance purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Your Rights</h2>
            <p className="mb-2">Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Export your data in a portable format</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, contact us at the email below.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Cookies</h2>
            <p>
              We use session cookies to keep you logged in. We do not use tracking or advertising cookies
              on our platform. Your QuoteBox forms may include a Meta Pixel if you configure one — that
              pixel is controlled by you and subject to Meta&apos;s privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Children&apos;s Privacy</h2>
            <p>
              QuoteBox is not directed at children under 13. We do not knowingly collect personal
              information from children.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant
              changes by posting the new policy on this page with an updated date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">11. Contact</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:support@quote-box.com" className="text-indigo-600 hover:underline">
                support@quote-box.com
              </a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
