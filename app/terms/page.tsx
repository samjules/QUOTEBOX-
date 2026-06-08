export const metadata = {
  title: 'Terms of Service — Quote Box by Arctic Reach LLC',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: June 8, 2026</p>

        <div className="space-y-8 text-gray-700 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h2>
            <p>
              By creating an account or using Quote Box (&quot;Service&quot;), a product of Arctic Reach LLC,
              you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
              These terms apply to all users, including business owners and their end customers who fill out Quote Box forms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Description of Service</h2>
            <p>
              Quote Box is a SaaS platform operated by Arctic Reach LLC that allows businesses to build quote forms,
              capture leads, send automated follow-up messages, and create Meta advertising campaigns using
              AI-generated copy. We provide tools to automate quoting, manage leads, and launch ads —
              we do not provide advertising advisory or guarantee any advertising results.
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
              Quote Box offers paid subscription plans. Billing is handled through Stripe. By subscribing,
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
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. SMS Messaging</h2>
            <p className="mb-2">
              Quote Box enables businesses to send automated SMS messages to leads who have provided
              their phone number and opted in through a Quote Box form. The following terms apply to
              all SMS communications sent through our platform:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-3">
              <li>
                <strong>Opt-in consent:</strong> SMS messages are only sent to individuals who have
                explicitly checked the SMS opt-in checkbox on a Quote Box form. Consent is never assumed
                or pre-checked. Businesses using Quote Box are responsible for ensuring their forms
                display clear opt-in language before collecting phone numbers.
              </li>
              <li>
                <strong>Message content:</strong> SMS messages sent through Quote Box may include
                quote follow-ups, booking reminders, appointment confirmations, and promotional offers
                related to the specific business the recipient contacted.
              </li>
              <li>
                <strong>Message frequency:</strong> Message frequency varies by business and lead activity.
                Typically no more than 3–5 messages per lead sequence.
              </li>
              <li>
                <strong>Message and data rates:</strong> Standard message and data rates may apply
                depending on the recipient&apos;s mobile carrier and plan.
              </li>
              <li>
                <strong>Opt-out:</strong> Recipients may opt out at any time by replying <strong>STOP</strong> to
                any message. Upon receiving STOP, no further messages will be sent to that number.
                Replying <strong>HELP</strong> returns support contact information.
              </li>
              <li>
                <strong>No sharing:</strong> Phone numbers collected through Quote Box forms are never
                sold, rented, or shared with third parties for their own marketing purposes.
              </li>
              <li>
                <strong>Business responsibility:</strong> Businesses using Quote Box are solely responsible
                for ensuring their SMS messaging complies with all applicable laws, including the TCPA
                (Telephone Consumer Protection Act) and any applicable state regulations.
              </li>
            </ul>
            <p>
              SMS delivery is powered by Twilio. By using the SMS features of Quote Box, you agree to
              Twilio&apos;s{' '}
              <a href="https://www.twilio.com/en-us/legal/aup" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">
                Acceptable Use Policy
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Acceptable Use</h2>
            <p className="mb-2">You agree not to use Quote Box to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Violate any applicable laws or regulations, including TCPA and CAN-SPAM</li>
              <li>Send SMS messages to individuals who have not opted in</li>
              <li>Create ads or forms that are deceptive, discriminatory, or violate Meta&apos;s advertising policies</li>
              <li>Collect personal data without proper consent from end users</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Resell or sublicense the Service without written permission</li>
              <li>Use the AI features to generate content that violates third-party rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Meta Ads Integration</h2>
            <p className="mb-2">
              By connecting your Meta account, you authorize Quote Box to create campaigns, ad sets,
              and ads on your behalf using the permissions you grant. You are solely responsible for
              any ad spend incurred in your Meta Ads account.
            </p>
            <p>
              Quote Box creates all ads in PAUSED status — no spending occurs until you manually
              activate them in Meta Ads Manager. We are not responsible for ad performance or
              any charges from Meta.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. AI-Generated Content</h2>
            <p>
              Quote Box uses AI to generate ad copy, form content, and campaign suggestions. You are
              responsible for reviewing all AI-generated content before publishing. We do not guarantee
              the accuracy, legality, or effectiveness of any AI-generated output.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Lead Data</h2>
            <p>
              Leads collected through your Quote Box forms are your data. You are responsible for
              complying with applicable privacy laws (including GDPR, CCPA, and TCPA) when collecting
              and using lead data. Quote Box stores this data as a data processor on your behalf.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Intellectual Property</h2>
            <p>
              Quote Box and its original content, features, and functionality are owned by Arctic Reach LLC and
              protected by intellectual property laws. You retain ownership of your business data,
              form configurations, and uploaded files.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">11. Disclaimers and Limitation of Liability</h2>
            <p className="mb-2">
              The Service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee
              uninterrupted or error-free operation.
            </p>
            <p>
              To the maximum extent permitted by law, Arctic Reach LLC shall not be liable for any indirect,
              incidental, special, or consequential damages, including lost profits or data, arising
              from your use of the Service. Our total liability shall not exceed the amount you paid
              us in the 3 months prior to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">12. Termination</h2>
            <p>
              We may suspend or terminate your account at any time for violation of these terms.
              You may cancel your account at any time through the billing settings. Upon termination,
              your data will be retained for 30 days before deletion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">13. Changes to Terms</h2>
            <p>
              We may update these terms at any time. We will notify you of material changes by email
              or an in-app notice. Continued use of the Service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">14. Governing Law</h2>
            <p>
              These terms are governed by the laws of the United States. Any disputes shall be
              resolved through binding arbitration, except where prohibited by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">15. Contact</h2>
            <p className="mb-1">Arctic Reach LLC — Quote Box</p>
            <p>
              Email:{' '}
              <a href="mailto:support@quote-box.com" className="text-indigo-600 hover:underline">
                support@quote-box.com
              </a>
              <br />
              Website: <a href="https://quote-box.com" className="text-indigo-600 hover:underline">quote-box.com</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
