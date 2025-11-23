/**
 * Basic Phlag Client Usage Example (JavaScript)
 *
 * This is the JavaScript version of basic.ts for those not using TypeScript.
 * Run with: node examples/basic.js
 */

const { PhlagClient } = require('@moonspot/phlag-client');

async function main() {
  // Create a client for your environment
  const client = new PhlagClient({
    baseUrl: 'http://localhost:8000',
    apiKey: 'your-64-character-api-key-here-replace-with-real-key-from-phlag',
    environment: 'production',
  });

  console.log('=== Basic Phlag Client Usage ===\n');

  // Example 1: Check if a feature is enabled
  console.log('1. Checking feature flags:');
  const checkoutEnabled = await client.isEnabled('feature_checkout');
  console.log(`   New checkout enabled: ${checkoutEnabled}`);

  if (checkoutEnabled) {
    console.log('   → Using new checkout flow');
  } else {
    console.log('   → Using legacy checkout flow');
  }

  // Example 2: Get configuration values
  console.log('\n2. Getting configuration values:');

  const maxItems = await client.getFlag('max_items');
  console.log(`   Max items per user: ${maxItems ?? 'not set'}`);

  const priceMultiplier = await client.getFlag('price_multiplier');
  console.log(`   Price multiplier: ${priceMultiplier ?? 'not set'}`);

  const welcomeMessage = await client.getFlag('welcome_message');
  console.log(`   Welcome message: "${welcomeMessage ?? 'not set'}"`);

  // Example 3: Using flag values in application logic
  console.log('\n3. Application logic example:');

  const rateLimit = await client.getFlag('rate_limit');
  const actualLimit = rateLimit ?? 100; // Default to 100 if not set

  console.log(`   API rate limit: ${actualLimit} requests/minute`);
  console.log(`   → Configuring rate limiter with ${actualLimit} req/min`);

  // Example 4: Get current environment
  console.log(`\n4. Current environment: ${client.getEnvironment()}`);
}

// Run the example
main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
