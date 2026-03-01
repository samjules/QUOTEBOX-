export const metadata = {
  title: 'Terms of Service — QuoteBox',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: March 1, 2026</p>

        <div className="space-y-8 text-gray-700 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h2>
            <p>
              By creating an account or using QuoteBox (&quot;Service&quot;), you agree to be bound by these
              Terms of Service. If you do not agree, do not use the Service. These terms apply to all
              users, including business owners and their end customers who fill out QuoteBox forms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Description of Service</h2>
            <p>
              QuoteBox is a SaaS platform that allows businesses to build quote forms, capture leads,
              and create Meta advertising campaigns using AI-generated copy. We provide tools to
              automate quoting, manage leads, and launch ads — we do not provide advertising advisory
              or guarantee any advertising results.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Accounts</h2>
            <p className="mb-2">
              You are responsible for maintaining the security of your account credentials. You must
              provide accurate information when registering. We reserve the right to terminate accounts
              that violate these terms.
            </p>
            <p>
              You must be at least 18 years old and have the authority to bind your business to these
              terms if signing up on behalf of a company.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Subscription and Billing</h2>
            <p className="mb-2">
              QuoteBox offers paid subscription plans. Billing is handled through Stripe. By subscribing,
              you authorize us to charge your payment method on a recurring basis.
            </p>
            <p className="mb-2">
              Subscriptions renew automatically unless cancelled before the renewal date. Refunds are
              evaluated on a case-by-case basis — contact us within 7 days of a charge if you believe
              it was made in error.
            </p>
            <p>
              We reserve the right to change pricing with 30 days&apos; notice. Continued use after a
              price change constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Acceptable Use</h2>
            <p className="mb-2">You agree not to use QuoteBox to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Violate any applicable laws or regulations</li>
              <li>Create ads or forms that are deceptive, discriminatory, or violate Meta&apos;s advertising policies</li>
              <li>Collect personal data without proper consent from end users</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Resell or sublicense the Service without written permission</li>
              <li>Use the AI features to generate content that violates third-party rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Meta Ads Integration</h2>
            <p className="mb-2">
              By connecting your Meta account, you authorize QuoteBox to create campaigns, ad sets,
              and ads on your behalf using the permissions you grant. You are solely responsible for
              any ad spend incurred in your Meta Ads account.
            </p>
            <p>
              QuoteBox creates all ads in PAUSED status — no spending occurs until you manually
              activate them in Meta Ads Manager. We are not responsible for ad performance or
              any charges from Meta.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. AI-Generated Content</h2>
            <p>
              QuoteBox uses AI to generate ad copy, form content, and campaign suggestions. You are
              responsible for reviewing all AI-generated content before publishing. We do not guarantee
              the accuracy, legality, or effectiveness of any AI-generated output.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Lead Data</h2>
            <p>
              Leads collected through your QuoteBox forms are your data. You are responsible for
              complying with applicable privacy laws (including GDPR and CCPA) when collecting and
              using lead data. QuoteBox stores this data as a data processor on your behalf.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Intellectual Property</h2>
            <p>
              QuoteBox and its original content, features, and functionality are owned by us and
              protected by intellectual property laws. You retain ownership of your business data,
              form configurations, and uploaded files.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Disclaimers and Limitation of Liability</h2>
            <p className="mb-2">
              The Service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee
              uninterrupted or error-free operation.
            </p>
            <p>
              To the maximum extent permitted by law, QuoteBox shall not be liable for any indirect,
              incidental, special, or consequential damages, including lost profits or data, arising
              from your use of the Service. Our total liability shall not exceed the amount you paid
              us in the 3 months prior to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">11. Termination</h2>
            <p>
              We may suspend or terminate your account at any time for violation of these terms.
              You may cancel your account at any time through the billing settings. Upon termination,
              your data will be retained for 30 days before deletion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">12. Changes to Terms</h2>
            <p>
              We may update these terms at any time. We will notify you of material changes by email
              or an in-app notice. Continued use of the Service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">13. Governing Law</h2>
            <p>
              These terms are governed by the laws of the United States. Any disputes shall be
              resolved through binding arbitration, except where prohibited by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">14. Contact</h2>
            <p>
              For questions about these Terms, contact us at{' '}
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
