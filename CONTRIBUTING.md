# Contributing to ATX File Manager

Thank you for your interest in contributing to ATX File Manager! This document provides guidelines for contributing to the project.

## Code of Conduct

We expect all contributors to adhere to our code of conduct:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (OS, Node.js version, etc.)

### Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:

- A clear and descriptive title
- Detailed explanation of the proposed feature
- Use cases and examples
- Any alternative solutions you've considered

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm test`, `npm run lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

#### Pull Request Guidelines

- Follow the existing code style
- Write clear commit messages
- Include tests for new features
- Update documentation as needed
- Keep PRs focused on a single feature or fix
- Ensure all tests pass
- Add screenshots for UI changes

## Development Setup

See the main README.md for development setup instructions.

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Avoid using `any` type when possible
- Document complex functions with JSDoc comments

### Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Use trailing commas in objects and arrays
- Max line length: 120 characters

### Git Commits

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Reference issues and pull requests when applicable
- Keep commits focused and atomic

### Testing

- Write unit tests for new features
- Maintain or improve test coverage
- Test edge cases and error conditions

## Project Structure

```
src/
├── config/        # Configuration files
├── controllers/   # Request handlers
├── database/      # Database schemas and migrations
├── middleware/    # Express middleware
├── routes/        # API routes
├── services/      # Business logic
├── types/         # TypeScript types
└── utils/         # Utility functions
```

## Questions?

Feel free to open an issue for questions or reach out to the maintainers.

Thank you for contributing! 🎉
