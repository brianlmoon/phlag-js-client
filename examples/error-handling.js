/**
 * Error Handling Example
 *
 * Demonstrates handling different error types that can occur when
 * working with the Phlag client.
 */

import {
  PhlagClient,
  AuthenticationError,
  NetworkError,
  InvalidEnvironmentError,
  InvalidFlagError,
} from '@moonspot/phlag-client';

async function main() {
  console.log('=== Error Handling Examples ===\n');

  // Example 1: Invalid API Key (AuthenticationError)
  console.log('1. Handling authentication errors:');

  try {
    const badClient = new PhlagClient({
      baseUrl: 'http://localhost:8000',
      apiKey: 'invalid-key',
      environment: 'production',
    });

    await badClient.isEnabled('feature_checkout');
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.log('   ✓ Caught AuthenticationError');
      console.log(`   Message: ${error.message}`);
      console.log('   Action: Check API key configuration');
    }
  }

  // Example 2: Network errors
  console.log('\n2. Handling network errors:');

  try {
    const unreachableClient = new PhlagClient({
      baseUrl: 'http://localhost:9999', // Non-existent server
      apiKey: 'your-64-character-api-key-here-replace-with-real-key-from-phlag',
      environment: 'production',
      timeout: 1000, // Short timeout
    });

    await unreachableClient.isEnabled('feature_checkout');
  } catch (error) {
    if (error instanceof NetworkError) {
      console.log('   ✓ Caught NetworkError');
      console.log(`   Message: ${error.message}`);
      console.log('   Action: Check server URL and network connectivity');
    }
  }

  // Example 3: Invalid environment
  console.log('\n3. Handling invalid environment errors:');

  try {
    const client = new PhlagClient({
      baseUrl: 'http://localhost:8000',
      apiKey: 'your-64-character-api-key-here-replace-with-real-key-from-phlag',
      environment: 'nonexistent_env',
    });

    await client.isEnabled('feature_checkout');
  } catch (error) {
    if (error instanceof InvalidEnvironmentError) {
      console.log('   ✓ Caught InvalidEnvironmentError');
      console.log(`   Message: ${error.message}`);
      console.log('   Action: Verify environment exists in Phlag admin');
    }
  }

  // Example 4: Graceful degradation pattern
  console.log('\n4. Graceful degradation with fallback values:');

  async function isFeatureEnabled(client, flagName, fallback = false) {
    try {
      return await client.isEnabled(flagName);
    } catch (error) {
      console.log(`   ⚠ Error checking ${flagName}: ${error.message}`);
      console.log(`   → Using fallback value: ${fallback}`);
      return fallback;
    }
  }

  const client = new PhlagClient({
    baseUrl: 'http://localhost:9999',
    apiKey: 'test-key',
    environment: 'production',
    timeout: 500,
  });

  const checkoutEnabled = await isFeatureEnabled(client, 'feature_checkout', false);
  console.log(`   Checkout enabled: ${checkoutEnabled}`);

  // Example 5: Retry pattern
  console.log('\n5. Retry pattern for transient errors:');

  async function getWithRetry(client, flagName, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await client.getFlag(flagName);
      } catch (error) {
        console.log(`   Attempt ${attempt}/${maxRetries} failed: ${error.message}`);

        if (attempt === maxRetries) {
          console.log('   All retries exhausted');
          throw error;
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 100;
        console.log(`   Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  try {
    await getWithRetry(client, 'max_items');
  } catch (error) {
    console.log('   Final error after retries:', error.message);
  }

  // Example 6: Logging and monitoring
  console.log('\n6. Logging and monitoring pattern:\n');

  console.log(`   async function getFlag(flagName) {
     try {
       const value = await client.getFlag(flagName);
       
       // Success metric
       metrics.increment('phlag.success');
       
       return value;
     } catch (error) {
       // Error metric
       metrics.increment('phlag.error', {
         type: error.constructor.name,
         flag: flagName
       });
       
       // Log details
       logger.error('Phlag error', {
         flag: flagName,
         error: error.message,
         type: error.constructor.name
       });
       
       throw error;
     }
   }`);

  // Example 7: Error type checking
  console.log('\n7. Specific error handling:\n');

  console.log(`   try {
     await client.isEnabled('feature_checkout');
   } catch (error) {
     if (error instanceof AuthenticationError) {
       // Alert DevOps - credentials issue
       alertOps('Invalid Phlag API key');
     } else if (error instanceof NetworkError) {
       // Might be transient - retry
       await retry();
     } else if (error instanceof InvalidEnvironmentError) {
       // Configuration issue - alert
       alertOps('Invalid environment config');
     } else {
       // Unknown error
       throw error;
     }
   }`);

  console.log('\n8. Best practices:');
  console.log('   ✓ Always handle authentication errors at startup');
  console.log('   ✓ Use fallback values for critical features');
  console.log('   ✓ Implement retry logic for transient network errors');
  console.log('   ✓ Log errors with context for debugging');
  console.log('   ✓ Monitor error rates in production');
  console.log('   ✓ Fail gracefully - never crash the app');
}

main().catch((error) => {
  console.error('Unhandled error:', error.message);
  process.exit(1);
});
