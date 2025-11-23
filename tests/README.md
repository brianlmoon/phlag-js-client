# Integration Tests

This directory contains integration tests that run against a real Phlag server.

## Test Files

- **`Client.test.ts`** - HTTP client unit tests (mocked)
- **`PhlagClient.test.ts`** - Core client unit tests (mocked)
- **`PhlagClient.cache.test.ts`** - Caching system unit tests (mocked)
- **`integration.test.ts`** - Integration tests (real Phlag server)

## Running Unit Tests

Unit tests run automatically with mocked fetch:

```bash
npm test
```

All unit tests (55 tests) will pass without any setup.

## Running Integration Tests

Integration tests are **skipped by default** and require a running Phlag server.

### Prerequisites

1. **Start a Phlag server** locally or use a test instance
2. **Create test environment** in Phlag admin (e.g., "development")
3. **Generate an API key** in Phlag admin
4. **Create test flags** (optional but recommended):
   - `test_boolean_flag` (SWITCH type)
   - `test_number_flag` (INTEGER type)
   - `test_string_flag` (STRING type)

### Running Integration Tests

Set environment variables and run:

```bash
# Required
export PHLAG_INTEGRATION_TEST=true
export PHLAG_URL=http://localhost:8000
export PHLAG_API_KEY=your-64-character-api-key-here

# Optional (defaults to 'development')
export PHLAG_ENVIRONMENT=development

# Run tests
npm test
```

Or as a one-liner:

```bash
PHLAG_INTEGRATION_TEST=true PHLAG_URL=http://localhost:8000 PHLAG_API_KEY=your-key npm test
```

### What Integration Tests Cover

When `PHLAG_INTEGRATION_TEST=true` is set, the integration tests verify:

1. **Basic Connectivity**
   - Can connect to Phlag server
   - Authentication works correctly
   - Invalid API key throws AuthenticationError
   - Invalid environment throws InvalidEnvironmentError

2. **Flag Operations**
   - Can retrieve boolean, number, and string flags
   - Non-existent flags throw InvalidFlagError
   - Flag types are correct

3. **Caching with Real Server**
   - Cache is populated from real server
   - Cached requests are faster than fresh requests
   - Cache warming works correctly

4. **Multi-Environment**
   - Can switch between environments
   - Each environment can be queried independently

5. **Error Recovery**
   - Network timeouts are handled gracefully
   - Server errors are handled gracefully

### Example Output

When integration tests run:

```
=== Integration Tests Running ===

Server: http://localhost:8000
Environment: development

For best results, create these test flags in your Phlag server:
- test_boolean_flag (SWITCH type)
- test_number_flag (INTEGER type)
- test_string_flag (STRING type)

Some tests will be skipped if these flags don't exist.

 ✓ Integration Tests (Real Phlag Server) (12 tests) 145ms
   ✓ Basic Connectivity (3 tests)
   ✓ Flag Operations (4 tests)
   ✓ Caching with Real Server (2 tests)
   ✓ Multi-Environment (1 test)
   ✓ Error Recovery (2 tests)
```

### Graceful Degradation

Integration tests are designed to be resilient:
- If test flags don't exist, those specific tests are skipped with a message
- Basic connectivity tests always run (just verify connection/authentication)
- Tests won't fail if optional flags are missing

## CI/CD

Integration tests are **not run in CI/CD** by default because they require:
- A running Phlag server
- Valid API credentials
- Test data setup

To run in CI/CD, you would need to:
1. Set up a test Phlag server
2. Add `PHLAG_API_KEY` to CI secrets
3. Add integration test step to workflow

## Test Count

- **Unit Tests**: 55 tests (always run)
- **Integration Tests**: 12 tests (opt-in with environment variable)
- **Total**: 67 tests

## Troubleshooting

### Tests are skipped

Set `PHLAG_INTEGRATION_TEST=true` environment variable.

### Authentication errors

Verify your API key is correct and has access to the specified environment.

### Connection errors

Ensure the Phlag server is running and accessible at `PHLAG_URL`.

### Flag not found errors

The integration tests will gracefully skip tests for missing flags. Create the test flags in your Phlag admin interface for full test coverage.
