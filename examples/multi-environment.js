/**
 * Multi-Environment Example
 *
 * Demonstrates querying flags across different environments using
 * withEnvironment() for immutable environment switching.
 */

import { PhlagClient } from '@moonspot/phlag-client';

async function main() {
  console.log('=== Multi-Environment Flag Queries ===\n');

  // Create a base client for production
  const prodClient = new PhlagClient({
    baseUrl: 'http://localhost:8000',
    apiKey: 'your-64-character-api-key-here-replace-with-real-key-from-phlag',
    environment: 'production',
  });

  // Create clients for other environments
  const stagingClient = prodClient.withEnvironment('staging');
  const devClient = prodClient.withEnvironment('development');

  console.log('1. Checking same flag across environments:');

  // Check the same flag in all environments
  const prodCheckout = await prodClient.isEnabled('feature_checkout');
  const stagingCheckout = await stagingClient.isEnabled('feature_checkout');
  const devCheckout = await devClient.isEnabled('feature_checkout');

  console.log(`   Production: ${prodCheckout}`);
  console.log(`   Staging:    ${stagingCheckout}`);
  console.log(`   Development: ${devCheckout}`);

  // Example use case: Gradual rollout
  console.log('\n2. Gradual rollout pattern:');
  console.log('   Development → Staging → Production');
  console.log(`   Dev enabled:  ${devCheckout}  (test new feature)`);
  console.log(`   Staging enabled: ${stagingCheckout} (QA verification)`);
  console.log(`   Prod enabled: ${prodCheckout}  (user rollout)`);

  // Example 3: Environment-specific configuration
  console.log('\n3. Environment-specific configuration:');

  const prodRateLimit = await prodClient.getFlag('rate_limit');
  const stagingRateLimit = await stagingClient.getFlag('rate_limit');
  const devRateLimit = await devClient.getFlag('rate_limit');

  console.log(`   Production rate limit: ${prodRateLimit ?? 100}`);
  console.log(`   Staging rate limit:    ${stagingRateLimit ?? 1000}`);
  console.log(`   Development rate limit: ${devRateLimit ?? 'unlimited'}`);

  // Example 4: Testing before production deployment
  console.log('\n4. Pre-deployment validation:');

  async function validateDeployment() {
    const stagingReady = await stagingClient.isEnabled('feature_checkout');

    if (stagingReady) {
      console.log('   ✓ Feature verified in staging');
      console.log('   → Safe to deploy to production');
      return true;
    } else {
      console.log('   ✗ Feature not enabled in staging');
      console.log('   → Do NOT deploy to production yet');
      return false;
    }
  }

  await validateDeployment();

  // Example 5: Dynamic environment selection
  console.log('\n5. Dynamic environment selection:');

  async function getConfigForEnvironment(env) {
    const client = prodClient.withEnvironment(env);
    const maxItems = await client.getFlag('max_items');
    const apiEndpoint = await client.getFlag('api_endpoint');

    return {
      environment: env,
      maxItems: maxItems ?? 10,
      apiEndpoint: apiEndpoint ?? 'http://api.example.com',
    };
  }

  const environments = ['development', 'staging', 'production'];

  for (const env of environments) {
    const config = await getConfigForEnvironment(env);
    console.log(`   ${config.environment}:`, config);
  }
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
