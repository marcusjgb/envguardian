
<p align="center">
  <img src="./assets/logo-light.png#gh-light-mode-only" alt="EnvGuardian logo" width="520" />
  <img src="./assets/logo-dark.png#gh-dark-mode-only" alt="EnvGuardian logo" width="520" />
</p>

<p align="center">
  <strong>Catch missing and inconsistent environment variables before deploy.</strong>
</p>

<p align="center">
  <a href="https://github.com/marcosjgb/envguardian/actions/workflows/envguardian.yml">
    <img alt="CI" src="https://github.com/marcosjgb/envguardian/actions/workflows/envguardian.yml/badge.svg" />
  </a>
  <img alt="npm version" src="https://img.shields.io/npm/v/@marcosjgb/envguardian" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-blue" />
  <img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" />
  <img alt="status" src="https://img.shields.io/badge/status-active-success" />
  
</p>

> ⚠️ Prevent broken deployments caused by missing environment variables.

---

# Demo

EnvGuardian scans your project and detects missing environment variables before deployment.

![EnvGuardian Demo](./assets/demo.gif)

Example command:

```bash
npx @marcosjgb/envguardian check --cwd tests/fixtures/sample-project
```

Example output:

```text
EnvGuardian
Scanning project: tests/fixtures/sample-project

EnvGuardian Report

Project: sample-project
Variables detected in code: 3
Variables defined in .env: 3
Variables defined in .env.example: 3

✖ Missing in .env
  - VITE_API_URL

✖ Missing in .env.example
  - JWT_SECRET

ℹ Unused in .env
  - OLD_TOKEN

ℹ Unused in .env.example
  - UNUSED_EXAMPLE

FAIL: EnvGuardian found issues.
```

---

# What is EnvGuardian?

EnvGuardian scans your project, detects environment variables used in the codebase, and compares them with your `.env` files to identify missing, unused, and inconsistent variables.

The goal is simple: catch env problems before they break local development, CI, staging, or production.

---

# Features

- Detect environment variables used in your code
- Compare `.env`, `.env.example`, and other env files
- Identify missing variables
- Detect unused variables
- Work in CI pipelines
- Stay stack-agnostic
- Help prevent “works on my machine” env issues

---

# Quick Start

Run EnvGuardian without installing anything:

```bash
npx @marcosjgb/envguardian check
```

---

# Installation

Install globally:

```bash
npm install -g @marcosjgb/envguardian
```

Then run:

```bash
envguardian check
```

---

# Supported Patterns

EnvGuardian detects common patterns used to access environment variables.

### Node.js

```js
process.env.VARIABLE_NAME
process.env["VARIABLE_NAME"]
```

### Vite / Frontend

```js
import.meta.env.VARIABLE_NAME
```

### Python

```python
os.getenv("VARIABLE_NAME")
```

### Ruby

```ruby
ENV["VARIABLE_NAME"]
```

---

# Example Use Case

You deploy a project and everything works locally, but production crashes because a required variable is missing.

EnvGuardian helps detect the issue before deploy:

```bash
envguardian check
```

Result:

```text
Missing variables:
DATABASE_URL
JWT_SECRET
```

---

# Planned Commands

```bash
envguardian check
envguardian doctor
envguardian sync
envguardian init
```

---

# CI Integration

Example GitHub Action:

```yaml
- name: Check env variables
  run: npx @marcosjgb/envguardian check
```

If variables are missing, the build should fail.

---

# Project Structure

```text
envguardian/
├─ assets/
├─ src/
│  ├─ cli/
│  ├─ commands/
│  ├─ core/
│  ├─ config/
│  └─ utils/
├─ tests/
├─ README.md
├─ CONTRIBUTING.md
├─ CODE_OF_CONDUCT.md
└─ ROADMAP.md
```

---

# Roadmap

See [ROADMAP.md](./ROADMAP.md).

---

# Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening an issue or pull request.

---

# Code of Conduct

Please read [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

---

# License

MIT
