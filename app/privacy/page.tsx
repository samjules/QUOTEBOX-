export const metadata = {
  title: 'Privacy Policy — Quote Box by Arctic Reach LLC',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: June 8, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Overview</h2>
            <p>
              Quote Box is a product of Arctic Reach LLC (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). We operate the
              website at quote-box.com and provide quote generation, lead capture, automated messaging,
              and Meta Ads management tools for businesses. This Privacy Policy explains what information
              we collect, how we use it, and your rights regarding your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Information We Collect</h2>
            <p className="mb-3"><strong>Account information:</strong> When you sign up, we collect your email address and any business details you provide during onboarding.</p>
            <p className="mb-3"><strong>Lead data:</strong> When visitors fill out Quote Box forms, we collect the information they submit — including name, email address, phone number, and quote details — and store it on behalf of the business operating the form.</p>
            <p className="mb-3"><strong>Phone numbers:</strong> Phone numbers collected through Quote Box forms are used solely to deliver automated service notifications and follow-up messages on behalf of the business that operates the form. We do not use phone numbers for any other purpose.</p>
            <p className="mb-3"><strong>Payment information:</strong> Billing is handled by Stripe. We do not store your credit card details. We store your Stripe customer ID and subscription status.</p>
            <p className="mb-3"><strong>Meta / Facebook data:</strong> If you connect a Meta Ads account, we store an access token and ad account ID to create campaigns on your behalf. We do not share this data with third parties.</p>
            <p><strong>Usage data:</strong> We may collect standard server logs including IP addresses, browser types, and pages visited for security and performance purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and operate the Quote Box platform</li>
              <li>To process payments and manage your subscription</li>
              <li>To send automated SMS and email follow-up messages to leads on behalf of businesses using Quote Box, where the lead has opted in</li>
              <li>To create and manage Meta Ads campaigns on your behalf</li>
              <li>To generate AI-powered ad copy using your business details</li>
              <li>To send transactional emails related to your account</li>
              <li>To improve our services and troubleshoot issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. SMS Messaging</h2>
            <p className="mb-3">
              By providing your phone number and checking the SMS opt-in box on a Quote Box form, you consent to receive
              automated text messages from the business operating that form, delivered through Quote Box (a product of Arctic Reach LLC).
            </p>
            <p className="mb-3">
              These messages may include: quote follow-ups, booking confirmations, appointment reminders, and promotional offers
              related to the specific business you contacted. Message frequency varies.
            </p>
            <p className="mb-3"><strong>Message and data rates may apply.</strong></p>
            <p className="mb-3">
              <strong>To opt out:</strong> Reply <strong>STOP</strong> to any text message at any time to unsubscribe.
              You will receive a single confirmation message and no further messages will be sent.
            </p>
            <p className="mb-3">
              <strong>For help:</strong> Reply <strong>HELP</strong> to any message or contact us at{' '}
              <a href="mailto:support@quote-box.com" className="text-brand-600 hover:underline">support@quote-box.com</a>.
            </p>
            <p>
              <strong>We do not sell, rent, or share phone numbers with third parties for their own marketing purposes.</strong>{' '}
              Phone numbers are only used to deliver messages on behalf of the business you contacted.
              SMS delivery is powered by Twilio, which operates under its own{' '}
              <a href="https://www.twilio.com/en-us/legal/privacy" className="text-brand-600 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Data Storage</h2>
            <p>
              Your data is stored securely using Supabase, which uses PostgreSQL hosted on AWS infrastructure.
              Uploaded files (images, videos) are stored in Supabase Storage. Data is stored in the United States.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Third-Party Services</h2>
            <p className="mb-2">We use the following third-party services:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase</strong> — database and file storage</li>
              <li><strong>Stripe</strong> — payment processing</li>
              <li><strong>Twilio</strong> — SMS message delivery</li>
              <li><strong>Meta (Facebook)</strong> — ad campaign management</li>
              <li><strong>Anthropic</strong> — AI-powered ad copy generation</li>
              <li><strong>Mapbox</strong> — route calculation in quote forms</li>
              <li><strong>Vercel</strong> — application hosting</li>
            </ul>
            <p className="mt-3">Each service operates under its own privacy policy. We only share data with these services as necessary to operate Quote Box.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active. If you delete your account,
              we will delete your data within 30 days, except where we are required to retain it for legal
              or financial compliance purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Your Rights</h2>
            <p className="mb-2">Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of SMS messages at any time by replying STOP</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, contact us at the email below.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Cookies</h2>
            <p>
              We use session cookies to keep you logged in. We do not use tracking or advertising cookies
              on our platform. Your Quote Box forms may include a Meta Pixel if you configure one — that
              pixel is controlled by you and subject to Meta&apos;s privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Children&apos;s Privacy</h2>
            <p>
              Quote Box is not directed at children under 13. We do not knowingly collect personal
              information from children.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant
              changes by posting the new policy on this page with an updated date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">12. Contact</h2>
            <p className="mb-1">
              Arctic Reach LLC — Quote Box
            </p>
            <p>
              Email:{' '}
              <a href="mailto:support@quote-box.com" className="text-brand-600 hover:underline">
                support@quote-box.com
              </a>
              <br />
              Website: <a href="https://quote-box.com" className="text-brand-600 hover:underline">quote-box.com</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
