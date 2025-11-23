/**
 * Configuration Example
 *
 * Demonstrates all available configuration options and advanced settings
 * for the Phlag client.
 */

import { PhlagClient } from '@moonspot/phlag-client';

async function main() {
  console.log('=== Configuration Examples ===\n');

  // Example 1: Minimal configuration
  console.log('1. Minimal configuration (required fields only):\n');

  console.log(`   const client = new PhlagClient({
     baseUrl: 'http://localhost:8000',
     apiKey: 'your-api-key',
     environment: 'production'
   });`);

  // Example 2: Full configuration with all options
  console.log('\n2. Full configuration with all options:\n');

  const fullClient = new PhlagClient({
    baseUrl: 'http://localhost:8000',
    apiKey: 'your-64-character-api-key-here-replace-with-real-key-from-phlag',
    environment: 'production',
    timeout: 5000, // Request timeout in milliseconds (default: 10000)
    cache: true, // Enable caching (default: false)
    cacheFile: '/tmp/phlag-cache.json', // Custom cache file path
    cacheTtl: 600, // Cache TTL in seconds (default: 300)
  });

  console.log(`   const client = new PhlagClient({
     baseUrl: 'http://localhost:8000',
     apiKey: 'your-api-key',
     environment: 'production',
     timeout: 5000,          // 5 second timeout
     cache: true,            // Enable caching
     cacheFile: '/tmp/phlag-cache.json',  // Custom path
     cacheTtl: 600           // 10 minute cache
   });`);

  // Example 3: Using environment variables
  console.log('\n3. Configuration from environment variables:\n');

  console.log(`   const client = new PhlagClient({
     baseUrl: process.env.PHLAG_URL || 'http://localhost:8000',
     apiKey: process.env.PHLAG_API_KEY,
     environment: process.env.NODE_ENV || 'development',
     cache: process.env.PHLAG_CACHE === 'true',
     cacheTtl: parseInt(process.env.PHLAG_CACHE_TTL || '300')
   });`);

  // Example 4: Different configurations per environment
  console.log('\n4. Environment-specific configurations:\n');

  console.log(`   function createClient() {
     const env = process.env.NODE_ENV;
     
     const configs = {
       production: {
         baseUrl: 'https://phlag.example.com',
         timeout: 10000,
         cache: true,
         cacheTtl: 600
       },
       staging: {
         baseUrl: 'https://phlag-staging.example.com',
         timeout: 5000,
         cache: true,
         cacheTtl: 300
       },
       development: {
         baseUrl: 'http://localhost:8000',
         timeout: 30000,
         cache: false
       }
     };
     
     return new PhlagClient({
       ...configs[env],
       apiKey: process.env.PHLAG_API_KEY,
       environment: env
     });
   }`);

  // Example 5: Timeout configurations
  console.log('\n5. Timeout configurations:');

  const quickClient = new PhlagClient({
    baseUrl: 'http://localhost:8000',
    apiKey: 'your-64-character-api-key-here-replace-with-real-key-from-phlag',
    environment: 'production',
    timeout: 1000, // Very fast timeout for local servers
  });

  console.log('   Quick timeout (1 second): For local/fast servers');

  const patientClient = new PhlagClient({
    baseUrl: 'http://localhost:8000',
    apiKey: 'your-64-character-api-key-here-replace-with-real-key-from-phlag',
    environment: 'production',
    timeout: 30000, // Long timeout for slow networks
  });

  console.log('   Patient timeout (30 seconds): For slow networks or initial deployment');

  // Example 6: Cache configurations
  console.log('\n6. Cache configuration strategies:');

  console.log('\n   a) No cache (always fresh data):');
  console.log(`      cache: false`);
  console.log('      Use case: Critical flags that change frequently');

  console.log('\n   b) Short cache (near real-time):');
  console.log(`      cache: true, cacheTtl: 60`);
  console.log('      Use case: Balance between performance and freshness');

  console.log('\n   c) Long cache (high performance):');
  console.log(`      cache: true, cacheTtl: 3600`);
  console.log('      Use case: Rarely changing flags, high-traffic apps');

  console.log('\n   d) Custom cache location:');
  console.log(`      cacheFile: '/var/cache/myapp/phlag.json'`);
  console.log('      Use case: Shared cache across processes');

  // Example 7: Subdirectory URLs
  console.log('\n7. Server with subdirectory:\n');

  console.log(`   // If Phlag is at https://example.com/api/phlag
   const client = new PhlagClient({
     baseUrl: 'https://example.com/api/phlag',
     apiKey: 'your-api-key',
     environment: 'production'
   });`);

  // Example 8: Factory pattern
  console.log('\n8. Client factory pattern:\n');

  console.log(`   class PhlagFactory {
     static create(environment) {
       return new PhlagClient({
         baseUrl: process.env.PHLAG_URL,
         apiKey: process.env.PHLAG_API_KEY,
         environment: environment,
         cache: true,
         cacheTtl: 300
       });
     }
     
     static forRequest(req) {
       // Determine environment from request
       const env = req.headers['x-environment'] || 'production';
       return this.create(env);
     }
   }
   
   // Usage
   const client = PhlagFactory.create('production');
   const reqClient = PhlagFactory.forRequest(req);`);

  // Example 9: Validation
  console.log('\n9. Configuration validation:\n');

  console.log(`   function validateConfig() {
     if (!process.env.PHLAG_API_KEY) {
       throw new Error('PHLAG_API_KEY not set');
     }
     
     if (process.env.PHLAG_API_KEY.length !== 64) {
       throw new Error('Invalid API key length');
     }
     
     const validEnvs = ['development', 'staging', 'production'];
     if (!validEnvs.includes(process.env.NODE_ENV)) {
       throw new Error('Invalid NODE_ENV');
     }
   }
   
   validateConfig();
   const client = new PhlagClient({...});`);

  console.log('\n10. Configuration best practices:');
  console.log('   ✓ Store API keys in environment variables, not code');
  console.log('   ✓ Use different API keys per environment');
  console.log('   ✓ Enable caching in production for performance');
  console.log('   ✓ Use shorter TTL in development for quick iteration');
  console.log('   ✓ Set appropriate timeouts based on network conditions');
  console.log('   ✓ Validate configuration at application startup');
  console.log('   ✓ Use factory pattern for consistent client creation');
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
