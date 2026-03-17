# EnvGuardian Roadmap

This roadmap defines the first milestones for EnvGuardian.

The immediate goal is to ship a useful CLI MVP that can scan a repository, detect env variables used in code, compare them with `.env` files, and report missing or unused entries.

## v0.1 - MVP

Core goals:

- create the CLI entry point
- implement `envguardian check`
- scan JS and TS files
- detect common env access patterns
- parse `.env` and `.env.example`
- report missing variables
- report unused variables
- return proper exit codes for CI

Deliverables:

- basic CLI command
- simple console output
- test fixtures for sample projects
- updated README with usage examples

## v0.2 - Usability

Goals:

- add config file support with `.envguardian.json`
- support ignore lists
- support additional file patterns
- improve report formatting
- support `process.env["KEY"]`
- support `import.meta.env.KEY`

Deliverables:

- config loader
- better terminal UX
- more fixtures and tests

## v0.3 - CI and Output

Goals:

- add JSON output mode
- make CI integration easier
- improve error messages
- start Python support with `os.getenv("KEY")`

Deliverables:

- `--json` output
- CI-friendly exit behavior
- first cross-language support

## v0.4 - Advanced Checks

Goals:

- detect inconsistencies between multiple env files
- add `envguardian doctor`
- add `envguardian init`
- add `envguardian sync`

Deliverables:

- richer diagnostics
- project initialization support
- better alignment between `.env` files

## v1.0 - Stable Release

Goals:

- stabilize the CLI API
- define plugin architecture
- support more languages and frameworks
- improve docs and contribution flow

Deliverables:

- stable command behavior
- plugin-ready internal structure
- polished docs
- first public launch campaign

## Nice-to-Have Later

Possible future ideas:

- GitHub Action
- VS Code integration
- Markdown report output
- framework plugins
- dashboard or web docs
- package registry badges once published
