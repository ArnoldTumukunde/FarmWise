/**
 * Sandbox smoke test for SubmitOrderRequest + GetTransactionStatus.
 * Asserts the redirect URL parses, prints the orderTrackingId, then queries
 * status (expected: INVALID — order not paid).
 */
import { PesapalService } from '../src/services/pesapal.service';

async function main() {
  const merchantRef = `smoketest-${Date.now()}`;
  console.log(`Submitting order with reference: ${merchantRef}`);

  const result = await PesapalService.submitOrder({
    merchantReference: merchantRef,
    currency: 'UGX',
    amount: 1000,
    description: 'Smoke test order',
    callbackUrl: 'http://localhost:5173/payments/return',
    notificationId: process.env.PESAPAL_IPN_ID!,
    billing: {
      email: 'test+smoke@farmwise.test',
      phone: '256700000000',
      firstName: 'Smoke',
      lastName: 'Test',
      countryCode: 'UG',
    },
  });

  console.log('\n✓ submitOrder OK:');
  console.log('  orderTrackingId:', result.orderTrackingId);
  console.log('  redirectUrl:    ', result.redirectUrl);

  // Validate redirect URL shape
  const url = new URL(result.redirectUrl);
  if (!url.host.includes('pesapal.com')) {
    throw new Error(`Unexpected redirect host: ${url.host}`);
  }

  console.log('\nQuerying status (expected INVALID — unpaid)...');
  const status = await PesapalService.getStatus(result.orderTrackingId);
  console.log('  status:', status.status, '(code:', status.statusCode, ')');
  console.log('  amount:', status.amount, status.currency);
  console.log('  paymentMethod:', status.paymentMethod ?? '(none)');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Smoke test FAILED:', err.message);
    if (err.pesapalError) console.error(JSON.stringify(err.pesapalError, null, 2));
    process.exit(1);
  });
