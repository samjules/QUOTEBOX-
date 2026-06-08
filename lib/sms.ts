export async function sendSms(to: string, body: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !from) return false

  const digits = to.replace(/\D/g, '')
  if (digits.length < 10) return false
  const e164 = digits.startsWith('1') ? `+${digits}` : `+1${digits}`

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ From: from, To: e164, Body: body }).toString(),
      }
    )
    return res.ok
  } catch {
    return false
  }
}
