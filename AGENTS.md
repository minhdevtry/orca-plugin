# Agents Guide for Orca Plugin

## Project Overview
This repository contains the **Orca AutoPilot Plugin** — an autonomous multi-agent coding platform and native Kanban board for Orca ADE.

## Development & Test
- Plugin directory: `orca-autopilot-plugin/`
- Run unit tests: `npm test` (inside `orca-autopilot-plugin`)
- Install into Orca: `node scripts/install-orca-plugin.mjs .`

## Agent skills
### Issue tracker
GitHub Issues at `https://github.com/minhdevtry/orca-plugin` (using `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels
Canonical 5 Matt Pocock triage labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs
Single-context layout documented in `CONTEXT.md`. See `docs/agents/domain.md`.
