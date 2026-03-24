# Doctor Score CLI

`vitek doctor` provides a deterministic quality score and actionable recommendations.

## Commands

```bash
vitek doctor
vitek doctor --json
vitek doctor --ai-analyze
```

Options:

- `--json` output machine-readable report
- `--root <dir>` set project root
- `--ai-analyze` run optional AI analysis workflow

## Dimensions

Current baseline scoring dimensions:

- Contracts
- Tests
- Security
- Observability
- Reliability (dispatch/events/scheduler)
- Docs
- Architecture

## AI mode

AI analysis is optional and respects `vitek.platform.json`:

- `ai.enabled`
- `ai.mode` (`off`, `local-only`, `remote-redacted`)
- `ai.redaction`

In `local-only`, Vitek writes a redacted payload to:

`/.vitek/doctor/ai-input.redacted.json`

`remote-redacted` is acknowledged in this baseline but network transport is intentionally not enabled by default.
