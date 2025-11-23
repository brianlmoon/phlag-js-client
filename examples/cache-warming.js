/**
 * Cache Warming Example
 *
 * Demonstrates preloading the cache at application startup for optimal
 * performance. This is useful for web servers and long-running processes.
 */

import { PhlagClient } from '@moonspot/phlag-client';

async function main() {
  console.log('=== Cache Warming Pattern ===\n');

  // Simulate application startup
  console.log('1. Application startup - warming cache:');

  const client = new PhlagClient({
    baseUrl: 'http://localhost:8000',
    apiKey: 'your-64-character-api-key-here-replace-with-real-key-from-phlag',
    environment: 'production',
    cache: true,
    cacheTtl: 300,
  });

  // Warm the cache before handling requests
  console.log('   Warming cache (fetching all flags)...');
  const warmStart = Date.now();
  await client.warmCache();
  const warmDuration = Date.now() - warmStart;
  console.log(`   ✓ Cache warmed in ${warmDuration}ms`);

  // Now all flag requests are instant
  console.log('\n2. Handling requests (all served from cache):');

  // Simulate 10 user requests
  for (let i = 1; i <= 10; i++) {
    const start = Date.now();
    await client.isEnabled('feature_checkout');
    await client.getFlag('max_items');
    await client.getFlag('welcome_message');
    const duration = Date.now() - start;
    console.log(`   Request ${i.toString().padStart(2)}: ${duration}ms (instant!)`);
  }

  // Example 3: Web server initialization
  console.log('\n3. Web server initialization pattern:\n');

  console.log(`   async function startServer() {
     // Create client
     const phlag = new PhlagClient({
       baseUrl: process.env.PHLAG_URL,
       apiKey: process.env.PHLAG_API_KEY,
       environment: process.env.NODE_ENV,
       cache: true,
     });

     // Warm cache before accepting requests
     console.log('Warming Phlag cache...');
     await phlag.warmCache();

     // Now start the server
     app.listen(3000, () => {
       console.log('Server ready with warmed cache!');
     });
   }`);

  // Example 4: Background refresh pattern
  console.log('\n4. Background cache refresh pattern:\n');

  console.log(`   // Refresh cache every 5 minutes
   setInterval(async () => {
     try {
       await client.clearCache();
       await client.warmCache();
       console.log('Cache refreshed');
     } catch (error) {
       console.error('Cache refresh failed:', error);
     }
   }, 5 * 60 * 1000);`);

  // Example 5: Multiple environments
  console.log('\n5. Warming cache for multiple environments:');

  const environments = ['development', 'staging', 'production'];

  for (const env of environments) {
    const envClient = client.withEnvironment(env);
    const start = Date.now();
    await envClient.warmCache();
    const duration = Date.now() - start;
    console.log(`   ${env}: warmed in ${duration}ms`);
  }

  // Example 6: Error handling during warm
  console.log('\n6. Error handling during cache warming:');

  console.log(`   try {
     await client.warmCache();
     console.log('Cache warmed successfully');
   } catch (error) {
     console.error('Failed to warm cache:', error.message);
     // Application can still work, just slower
     // Each getFlag() call will try to fetch individually
   }`);

  console.log('\n7. Benefits of cache warming:');
  console.log('   ✓ Predictable startup time');
  console.log('   ✓ Fast first request (no cold start)');
  console.log('   ✓ Reduced API load during traffic spikes');
  console.log('   ✓ Better user experience (consistent response times)');
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
