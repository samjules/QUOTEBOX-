import BookCallForm from './BookCallForm'

export default function BookCallPage() {
  return (
    <div className="p-8" style={{ background: '#f4f4f6', minHeight: '100%' }}>
      <h1 className="text-xl font-semibold mb-1" style={{ color: '#0e0020' }}>Book a call</h1>
      <p className="text-sm text-gray-500 mb-6">
        For phone sales — pick a date and time while you&apos;re on the phone, and we&apos;ll create the Zoom meeting and send the confirmation automatically.
      </p>
      <BookCallForm />
    </div>
  )
}
