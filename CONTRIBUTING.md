# Contributing to EnvGuardian

Thanks for your interest in contributing to EnvGuardian.

This project is being built as an open source developer tool focused on detecting environment variable problems before they reach staging or production. Contributions of all sizes are welcome.

## Ways to Contribute

You can help by:

- reporting bugs
- suggesting features
- improving documentation
- adding tests
- improving CLI UX
- adding language or framework support
- refining reports and output formatting

## Before You Start

Please:

1. Search existing issues before opening a new one.
2. Keep proposals focused and practical.
3. Prefer small, clear pull requests over very large ones.
4. Open an issue first for major changes.

## Development Setup

Clone the repository and install dependencies:

```bash
npm install
```

Run the project locally:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

## Branch Naming

Suggested branch naming:

```text
feature/short-description
fix/short-description
docs/short-description
chore/short-description
```

Examples:

```text
feature/add-json-output
fix/env-parser-empty-lines
docs/update-readme
```

## Commit Messages

Keep commit messages short and descriptive.

Examples:

```text
feat: add initial env scanner
fix: handle empty env lines
docs: update quick start
test: add fixture for missing variables
```

## Pull Request Guidelines

When opening a PR:

- explain what changed
- explain why it changed
- include screenshots or terminal output if relevant
- add or update tests when possible
- keep the scope limited to one concern

## Coding Style

General expectations:

- prefer readable code over clever code
- keep modules small and focused
- avoid unnecessary dependencies
- write explicit names
- add comments only when they improve clarity

## Reporting Bugs

Please include:

- operating system
- Node.js version
- package manager
- command executed
- expected behavior
- actual behavior
- sample files or reproduction steps if possible

## Feature Requests

A good feature request usually includes:

- the problem
- the expected outcome
- why existing behavior is not enough
- a minimal example

## First Good Issues

Good first contributions may include:

- improving console output
- adding tests for edge cases
- improving README examples
- adding support for another env access pattern
- improving config validation

## Questions

If something is unclear, open an issue and describe what you are trying to do.

Thanks for helping make EnvGuardian better.
