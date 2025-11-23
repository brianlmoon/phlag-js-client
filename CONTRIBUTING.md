# Contributing to Phlag Client

Thank you for your interest in contributing to the Phlag JavaScript/TypeScript client! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and professional. We're all here to build great software together.

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- Git
- A GitHub account

### Setup Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/phlag-js-client.git
   cd phlag-js-client
   ```

3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/moonspot/phlag-js-client.git
   ```

4. **Install dependencies** (for linting):
   ```bash
   npm install
   ```

5. **Verify everything works:**
   ```bash
   npm run build
   npm test
   ```

## Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

**Branch naming conventions:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test improvements

### 2. Make Your Changes

- **Write clear, focused commits** - One logical change per commit
- **Follow the coding standards** (see below)
- **Add tests** for new features or bug fixes
- **Update documentation** if needed

### 3. Test Your Changes

Before committing, ensure all checks pass:

```bash
# Format code
npm run format

# Run linter
npm run lint:fix

# Build the project
npm run build

# Run tests
npm test
```

All tests must pass before submitting a PR.

### 4. Commit Your Changes

Write clear, descriptive commit messages:

```bash
git add .
git commit -m "Add caching support for browser environments"
```

**Good commit messages:**
- Use present tense ("Add feature" not "Added feature")
- Start with a verb (Add, Fix, Update, Remove, etc.)
- Be specific about what changed
- Keep first line under 72 characters
- Add details in the body if needed

**Examples:**
```
Add support for custom cache serialization

- Implement CacheSerializer interface
- Add JSON and MessagePack serializers
- Update documentation with examples

Fixes #123
```

### 5. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create PR on GitHub
```

## Coding Standards

### TypeScript/JavaScript Style

We use **ESLint** and **Prettier** to enforce consistent code style.

**Key rules:**
- Use **single quotes** for strings
- Use **semicolons** at the end of statements
- **2 spaces** for indentation
- **100 characters** max line length
- Use `camelCase` for variables, methods, properties
- Use `PascalCase` for classes, types, interfaces
- Avoid `any` types - use `unknown` if type is truly unknown

**Example:**
```typescript
// Good
export class PhlagClient {
  private readonly apiKey: string;

  public async getFlag(name: string): Promise<FlagValue> {
    const result = await this.client.get<FlagValue>(
      `/flag/${this.environment}/${name}`
    );
    return result;
  }
}

// Bad
export class PhlagClient {
    private readonly apiKey:string  // no space before colon, missing semicolon

    public async getFlag(name:string):Promise<any> {  // using 'any'
        var result=await this.client.get(`/flag/${this.environment}/${name}`)  // var instead of const
        return result
    }
}
```

### Documentation Style

- Use **JSDoc comments** for public APIs
- Write in a **conversational style** (not overly formal)
- Include **examples** for complex features
- Use "Note:" or "Heads-up:" for warnings
- Explain **why**, not just **what**

**Example:**
```typescript
/**
 * Retrieves the value of a feature flag.
 *
 * This method returns the current value of the specified flag. If caching is
 * enabled, subsequent calls will return cached values until the TTL expires.
 *
 * @param name - The name of the flag to retrieve
 * @returns The flag value (boolean, number, string, or null)
 * @throws {InvalidFlagError} If the flag doesn't exist
 * @throws {AuthenticationError} If the API key is invalid
 * @throws {NetworkError} If the request fails
 *
 * @example
 * ```typescript
 * const maxItems = await client.getFlag('max_items');
 * if (maxItems !== null) {
 *   console.log(`Max items: ${maxItems}`);
 * }
 * ```
 */
public async getFlag(name: string): Promise<FlagValue> {
  // Implementation
}
```

### Testing Standards

- **Write tests for all new features**
- **Write tests for bug fixes** to prevent regression
- Use **descriptive test names**
- Follow the **Arrange-Act-Assert** pattern
- Use `describe` and `it` for organization

**Example:**
```typescript
describe('PhlagClient', () => {
  describe('getFlag', () => {
    it('should return flag value when flag exists', async () => {
      // Arrange
      const client = new PhlagClient({ ... });
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => true });

      // Act
      const result = await client.getFlag('test_flag');

      // Assert
      expect(result).toBe(true);
    });

    it('should throw InvalidFlagError when flag does not exist', async () => {
      // Arrange
      const client = new PhlagClient({ ... });
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

      // Act & Assert
      await expect(client.getFlag('missing_flag'))
        .rejects.toThrow(InvalidFlagError);
    });
  });
});
```

### File Organization

```
src/
├── index.ts              # Public exports only
├── PhlagClient.ts        # Main client class
├── Client.ts             # HTTP wrapper
├── cache.ts              # Caching utilities
├── types.ts              # Type definitions
└── exceptions/           # Error classes
    ├── index.ts
    ├── PhlagError.ts
    └── ...
```

## Types of Contributions

### Bug Fixes

1. **Check existing issues** - Make sure it hasn't been reported
2. **Create an issue** describing the bug (if it doesn't exist)
3. **Reference the issue** in your PR description
4. **Add a test** that fails without your fix

### New Features

1. **Discuss first** - Open an issue to discuss the feature
2. **Keep it focused** - One feature per PR
3. **Add tests** - Comprehensive test coverage required
4. **Update docs** - README.md, JSDoc comments, examples if needed
5. **Consider backwards compatibility** - Don't break existing APIs

### Documentation

- Fix typos and improve clarity
- Add examples for complex features
- Keep documentation up-to-date with code changes
- Use clear, conversational language

### Performance Improvements

- **Measure first** - Prove the improvement with benchmarks
- **Don't sacrifice readability** - Code should still be clear
- **Add comments** - Explain non-obvious optimizations

## Pull Request Process

### Before Submitting

- [ ] Code follows the style guidelines
- [ ] All tests pass (`npm test`)
- [ ] Code is formatted (`npm run format`)
- [ ] Linting passes (`npm run lint`)
- [ ] Documentation is updated
- [ ] Commit messages are clear
- [ ] PR targets the `main` branch

### PR Description

Write a clear description:

```markdown
## Description
Brief summary of changes

## Changes
- Bullet list of specific changes
- Keep it focused and clear

## Testing
How you tested these changes

## Related Issues
Fixes #123
Related to #456
```

### Review Process

1. **Automated checks** will run (tests, linting)
2. **Maintainer review** - May request changes
3. **Address feedback** - Make requested changes
4. **Approval and merge** - Once approved, maintainer will merge

### After Your PR is Merged

- Delete your branch
- Update your fork:
  ```bash
  git checkout main
  git pull upstream main
  git push origin main
  ```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

## Project Structure

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development setup and available commands.

## Questions?

- **Bug reports**: Open a GitHub issue
- **Feature requests**: Open a GitHub issue for discussion
- **General questions**: Contact brian@moonspot.net

## License

By contributing, you agree that your contributions will be licensed under the BSD 3-Clause License.

---

**Thank you for contributing to Phlag Client!** 🎉
