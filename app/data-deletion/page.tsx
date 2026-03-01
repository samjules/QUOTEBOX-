export const metadata = {
  title: 'Data Deletion Instructions — QuoteBox',
}

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Deletion Instructions</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: March 1, 2026</p>

        <div className="space-y-8 text-gray-700 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Overview</h2>
            <p>
              If you have connected your Facebook / Meta account to QuoteBox, we store a limited set
              of data obtained through the Meta Login flow. This page explains what data we store and
              how you can request its deletion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">What Data We Store from Meta</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your Meta user ID</li>
              <li>A long-lived Meta access token (used to manage ads on your behalf)</li>
              <li>Your selected Meta Ad Account ID</li>
              <li>The date your Meta account was connected</li>
            </ul>
            <p className="mt-3">
              We do not store your Facebook profile information, friends list, posts, or any other
              personal data beyond what is listed above.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">How to Delete Your Data</h2>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-5">
              <h3 className="font-semibold text-indigo-900 mb-3">Option 1 — Delete from within QuoteBox (Recommended)</h3>
              <ol className="list-decimal pl-5 space-y-2 text-indigo-800">
                <li>Log in to your QuoteBox account at <a href="https://quote-box.com" className="underline">quote-box.com</a></li>
                <li>Go to <strong>Settings</strong></li>
                <li>Find the <strong>Meta Ads</strong> section and click <strong>Disconnect</strong></li>
                <li>This immediately removes your Meta access token and linked account data from our systems</li>
              </ol>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-5">
              <h3 className="font-semibold text-gray-900 mb-3">Option 2 — Delete your entire QuoteBox account</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Log in to your QuoteBox account</li>
                <li>Go to <strong>Settings &gt; Account</strong></li>
                <li>Click <strong>Delete Account</strong></li>
                <li>All data associated with your account — including Meta credentials — will be permanently deleted within 30 days</li>
              </ol>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Option 3 — Email us</h3>
              <p>
                If you no longer have access to your QuoteBox account, send an email to{' '}
                <a href="mailto:support@quote-box.com" className="text-indigo-600 hover:underline">
                  support@quote-box.com
                </a>{' '}
                with the subject line <strong>&quot;Data Deletion Request&quot;</strong> and include the email
                address associated with your account. We will delete your data within 30 days and
                send you a confirmation.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Revoking Meta App Permissions</h2>
            <p className="mb-3">
              You can also revoke QuoteBox&apos;s access to your Facebook account directly through Facebook:
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Go to your <a href="https://www.facebook.com/settings?tab=applications" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Facebook App Settings</a></li>
              <li>Find <strong>QuoteBox</strong> in the list of apps</li>
              <li>Click <strong>Remove</strong></li>
            </ol>
            <p className="mt-3">
              Revoking access through Facebook will invalidate our access token. You should also
              disconnect from within QuoteBox (Option 1 above) to remove the stored token from our database.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact</h2>
            <p>
              For any questions about data deletion, contact us at{' '}
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
