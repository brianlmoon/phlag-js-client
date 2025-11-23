---
name: Bug Report
about: Report a bug or unexpected behavior
title: '[BUG] '
labels: bug
assignees: ''
---

## Description

A clear and concise description of the bug.

## Steps to Reproduce

1. Create a client with...
2. Call method...
3. See error...

## Expected Behavior

What you expected to happen.

## Actual Behavior

What actually happened.

## Environment

- **Package Version**: (e.g., 1.0.0)
- **Node.js Version**: (e.g., 18.20.0)
- **Operating System**: (e.g., macOS 14.0, Ubuntu 22.04)
- **Phlag Server Version**: (if applicable)

## Code Example

```typescript
// Minimal code to reproduce the issue
const client = new PhlagClient({
  baseUrl: 'http://localhost:8000',
  apiKey: 'your-api-key',
  environment: 'production',
});

const result = await client.getFlag('test_flag');
// Error occurs here
```

## Error Message/Stack Trace

```
Paste the error message or stack trace here
```

## Additional Context

Any other information that might be helpful (screenshots, logs, etc.).
