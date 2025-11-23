# Phlag Client Examples

This directory contains practical examples demonstrating how to use the Phlag JavaScript/TypeScript client in different scenarios.

## Examples

### Basic Usage
- **`basic.js`** - Simple feature flag checks (Node.js, JavaScript)
- **`basic.ts`** - TypeScript version with type safety

### Multi-Environment
- **`multi-environment.js`** - Querying flags across different environments

### Caching
- **`caching.js`** - Using built-in caching for performance
- **`cache-warming.js`** - Preloading cache at application startup

### Advanced
- **`error-handling.js`** - Handling different error types
- **`configuration.js`** - Advanced configuration options

## Running Examples

### Prerequisites

All examples require:
1. **A running Phlag server** - See the [Phlag repository](https://github.com/moonspot/phlag) for setup
2. **An API key** - Generated in the Phlag admin interface
3. **The parent package built** - Run `npm run build` in the parent directory

**Important:** These examples import from `@moonspot/phlag-client`, which must be available. You have two options:

#### Option 1: Link the local package (for development)

```bash
# From the project root directory
npm run build
npm link

# From the examples directory
npm link @moonspot/phlag-client
```

#### Option 2: Install from npm (when published)

```bash
cd examples
npm install @moonspot/phlag-client
```

### Setup

1. Update the examples with your Phlag server URL and API key:
   ```javascript
   baseUrl: 'http://localhost:8000',  // Your Phlag server
   apiKey: 'your-actual-api-key-here',
   ```

2. Ensure you have flags configured in your Phlag server (see "Example Environment Setup" below)

### JavaScript Examples

Use the convenient npm scripts from the examples directory:

```bash
cd examples

npm run basic              # Basic usage
npm run multi-env          # Multi-environment
npm run caching            # Caching demo
npm run cache-warming      # Cache warming
npm run error-handling     # Error handling
npm run config             # Configuration
```

Or run directly with Node.js:

```bash
node examples/basic.js
```

### TypeScript Examples

Use `tsx` to run TypeScript files directly:

```bash
cd examples
npm run basic:ts           # Run TypeScript version
```

Or manually:

```bash
npx tsx examples/basic.ts
```

Or compile first:

```bash
npx tsc examples/basic.ts --target ES2020 --module NodeNext --moduleResolution node
node examples/basic.js
```

## Example Environment Setup

For these examples to work, you should have flags configured in your Phlag server:

**SWITCH Flags:**
- `feature_checkout` - Boolean flag for new checkout flow
- `maintenance_mode` - Boolean flag for maintenance status

**INTEGER Flags:**
- `max_items` - Maximum items per user
- `rate_limit` - API rate limit

**FLOAT Flags:**
- `price_multiplier` - Price adjustment multiplier
- `discount_percentage` - Discount percentage

**STRING Flags:**
- `welcome_message` - Welcome message text
- `api_endpoint` - API endpoint URL

You can create these flags in multiple environments (development, staging, production) to test environment switching.

## Security Note

**Never commit API keys to version control!**

The examples use placeholder API keys. In production:
- Use environment variables: `process.env.PHLAG_API_KEY`
- Use secrets management tools
- Rotate keys regularly
