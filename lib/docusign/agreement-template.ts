export interface AgreementData {
  customerName: string
  customerEmail: string
  customerPhone: string | null
  pickupAddress: string | null
  deliveryAddress: string | null
  moveDate: string | null
  quoteAmount: number | null
  currency: string
  serviceDescription: string | null
  todayDate: string
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function buildAgreementHtml(data: AgreementData): string {
  const amount = data.quoteAmount
    ? `${data.currency}${data.quoteAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : 'TBD'

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px; }
  h1 { text-align: center; font-size: 22px; color: #1a1a2e; margin-bottom: 4px; }
  h2 { font-size: 16px; color: #1a1a2e; margin-top: 28px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
  .subtitle { text-align: center; color: #6b7280; font-size: 13px; margin-bottom: 32px; }
  .detail-grid { display: grid; grid-template-columns: 140px 1fr; gap: 6px 16px; margin: 16px 0; }
  .detail-label { font-weight: 600; color: #4b5563; }
  .detail-value { color: #111827; }
  .amount-box { background: #f9fafb; border: 2px solid #1a1a2e; border-radius: 8px; text-align: center; padding: 16px; margin: 20px 0; }
  .amount-box .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; }
  .amount-box .value { font-size: 28px; font-weight: 800; color: #1a1a2e; }
  .section-body { margin: 12px 0 8px; }
  ol li { margin-bottom: 8px; }
</style></head>
<body>

<h1>MOVING SERVICE AGREEMENT</h1>
<p class="subtitle">Titan Tuff Moving &mdash; ${esc(data.todayDate)}</p>

<h2>1. Parties</h2>
<div class="section-body">
  <p>This Agreement is entered into between <strong>Titan Tuff Moving</strong> (&ldquo;Company&rdquo;) and:</p>
  <div class="detail-grid">
    <span class="detail-label">Customer Name:</span>
    <span class="detail-value">${esc(data.customerName)}</span>
    <span class="detail-label">Email:</span>
    <span class="detail-value">${esc(data.customerEmail)}</span>${data.customerPhone ? `
    <span class="detail-label">Phone:</span>
    <span class="detail-value">${esc(data.customerPhone)}</span>` : ''}
  </div>
</div>

<h2>2. Move Details</h2>
<div class="detail-grid">${data.pickupAddress ? `
  <span class="detail-label">Pickup Address:</span>
  <span class="detail-value">${esc(data.pickupAddress)}</span>` : ''}${data.deliveryAddress ? `
  <span class="detail-label">Delivery Address:</span>
  <span class="detail-value">${esc(data.deliveryAddress)}</span>` : ''}${data.moveDate ? `
  <span class="detail-label">Move Date:</span>
  <span class="detail-value">${esc(data.moveDate)}</span>` : ''}${data.serviceDescription ? `
  <span class="detail-label">Services:</span>
  <span class="detail-value">${esc(data.serviceDescription)}</span>` : ''}
</div>

<div class="amount-box">
  <div class="label">Estimated Total</div>
  <div class="value">${amount}</div>
</div>

<h2>3. Services</h2>
<div class="section-body">
  <p>Company agrees to provide professional moving services including loading, transport, and unloading of Customer&rsquo;s household goods from the pickup address to the delivery address listed above.</p>
</div>

<h2>4. Pricing &amp; Payment</h2>
<div class="section-body">
  <ol>
    <li>The estimated price is <strong>${amount}</strong>. The final price may vary based on actual weight, additional services requested, or unforeseen circumstances.</li>
    <li>A deposit of 25% of the estimated total is due upon signing this Agreement.</li>
    <li>The remaining balance is due upon completion of the move.</li>
    <li>Accepted payment methods: credit/debit card, certified check, or electronic transfer.</li>
  </ol>
</div>

<h2>5. Liability &amp; Insurance</h2>
<div class="section-body">
  <ol>
    <li><strong>Basic Coverage (included):</strong> $0.60 per pound per article. This is the default valuation under federal regulations.</li>
    <li><strong>Full Value Protection (optional):</strong> Available at an additional charge. Company will repair, replace, or provide a cash settlement for items damaged during the move at current market value.</li>
    <li>Company is not liable for items packed by the Customer (PBO &mdash; Packed By Owner) unless damage to the outer container is evident.</li>
    <li>Company is not responsible for pre-existing damage, normal wear and tear, acts of God, or items of extraordinary value not declared in writing prior to the move.</li>
  </ol>
</div>

<h2>6. Cancellation Policy</h2>
<div class="section-body">
  <ol>
    <li>Cancellations made 72+ hours before the scheduled move date receive a full refund of the deposit.</li>
    <li>Cancellations made 24&ndash;72 hours before the move date are subject to a 50% forfeiture of the deposit.</li>
    <li>Cancellations made less than 24 hours before the move date forfeit the full deposit.</li>
  </ol>
</div>

<h2>7. Customer Responsibilities</h2>
<div class="section-body">
  <ol>
    <li>Customer must ensure clear access paths at both pickup and delivery locations.</li>
    <li>Customer is responsible for disconnecting and preparing appliances and electronics for transport.</li>
    <li>Hazardous materials, perishables, and prohibited items must not be included in the shipment.</li>
    <li>Customer should be present or have an authorized representative at both locations.</li>
  </ol>
</div>

<h2>8. Claims</h2>
<div class="section-body">
  <p>Any claims for loss or damage must be submitted in writing within 9 months of the delivery date. Company will acknowledge receipt within 30 days and resolve the claim within 120 days.</p>
</div>

<h2>9. Governing Law</h2>
<div class="section-body">
  <p>This Agreement shall be governed by the laws of the state in which the Company is registered. Any disputes shall be resolved through binding arbitration.</p>
</div>

<h2>10. Acceptance</h2>
<div class="section-body">
  <p>By signing below, both parties agree to the terms and conditions of this Agreement.</p>
</div>

<p style="margin-top: 40px;"><strong>Customer Signature:</strong></p>
<p>/sn1/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Date: /ds1/</p>
<p style="margin-top: 24px;">${esc(data.customerName)}</p>

<p style="margin-top: 32px;"><strong>Titan Tuff Moving</strong></p>
<p>Authorized Representative</p>

</body>
</html>`
}
