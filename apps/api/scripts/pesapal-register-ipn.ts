/**
 * One-time setup: register the Pesapal IPN URL and print the resulting ipn_id
 * so it can be saved to .env as PESAPAL_IPN_ID.
 *
 * Usage:
 *   PESAPAL_ENV=sandbox \
 *   PESAPAL_CONSUMER_KEY=... \
 *   PESAPAL_CONSUMER_SECRET=... \
 *   PESAPAL_IPN_URL=https://aan.academy/api/v1/payments/ipn \
 *     tsx apps/api/scripts/pesapal-register-ipn.ts
 *
 * The IPN ID is permanent for the URL — re-running creates a NEW registration
 * (and a new ID); existing registrations stay valid. Use --list to see all.
 */

import { PesapalService } from '../src/services/pesapal.service';

async function main() {
  const url = process.env.PESAPAL_IPN_URL;
  const args = process.argv.slice(2);

  if (args.includes('--list')) {
    const ipns = await PesapalService.listIpns();
    if (ipns.length === 0) {
      console.log('No IPN registrations found.');
      return;
    }
    console.log(`Found ${ipns.length} IPN registration(s):\n`);
    for (const r of ipns) {
      console.log(`  ipn_id: ${r.ipn_id}`);
      console.log(`     url: ${r.url}`);
      console.log(`  status: ${r.ipn_status_description}`);
      console.log('');
    }
    return;
  }

  if (!url) {
    console.error('Usage: PESAPAL_IPN_URL=https://... tsx apps/api/scripts/pesapal-register-ipn.ts');
    console.error('   or: tsx apps/api/scripts/pesapal-register-ipn.ts --list');
    process.exit(1);
  }

  console.log(`Registering IPN URL with Pesapal (${process.env.PESAPAL_ENV || 'sandbox'}):`);
  console.log(`  ${url}\n`);

  const ipnId = await PesapalService.registerIpn(url, 'POST');

  console.log('✓ Registered.\n');
  console.log('Add this to your .env file:');
  console.log('');
  console.log(`PESAPAL_IPN_ID=${ipnId}`);
  console.log('');
  console.log('Restart the API after updating .env.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed:', err.message);
    if (err.pesapalError) console.error(JSON.stringify(err.pesapalError, null, 2));
    process.exit(1);
  });
