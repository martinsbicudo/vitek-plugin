# Contributing

To contribute to Vitek Plugin, follow these steps.

## 1. Create a branch

```bash
git checkout -b feat/your-new-feature
```

## 2. Make changes and test

Make your changes and, if applicable, add or update tests.

**Before opening a PR**, the full check must pass. From the repo root run:

```bash
pnpm run check
```

This runs: install dependencies, build the plugin, unit tests, examples build-and-test, e2e test, and example benchmark. All of these must pass for your PR to be merged.

## Definition of Done (for changes in core/plugin)

- All checks pass: `pnpm run check`
- If you changed behavior, update at least one guide page under `docs/guide/`
- If you changed DX/APIs, update at least one relevant example under `examples/`
- If you touched examples, ensure their **post-build tests** still pass via `pnpm run examples:build-and-test`
- If you touched runtime/server behavior, ensure both e2e suites pass:
  - `pnpm run test:e2e`
  - `pnpm run test:e2e:socket`

A **pre-commit hook** (Husky) runs the same `pnpm run check` before each commit. If the check fails, the commit is aborted. A **commit-msg hook** (Husky + Commitlint) enforces [Conventional Commits](https://www.conventionalcommits.org/) (e.g. `feat:`, `fix:`, `chore:`). After `pnpm i`, hooks are configured automatically via the `prepare` script.

You can also test the plugin in a real app using **npm link**:

**In the vitek-plugin project:**

```bash
npm link
```

**In your app or example project:**

```bash
npm link vitek-plugin
```

This creates a symlink so your app uses the local plugin. You can iterate on the plugin and see changes after rebuilding. See [npm link](https://docs.npmjs.com/cli/v9/commands/npm-link) for details.

## 3. Add a changeset (when the package changes)

If your PR changes code, APIs, or anything that should ship on npm, add a changeset:

```bash
pnpm changeset
```

Pick **patch**, **minor**, or **major** as appropriate. Commit the generated `.changeset/*.md` file.

**You do not need a changeset** if any of these apply:

- Add the label **`no-changeset`** (e.g. internal tooling, CI-only, or you explicitly skip release).
- Your diff is **only** under the allowlist: `docs/**`, root `*.md` (e.g. `README.md`, `CHANGELOG.md`), `LICENSE*`, `.changeset/README.md`, `.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/**`.

## 4. Open a pull request

Fill the PR template. CI fails if a changeset is required and none of the bypass rules above apply.

## After merge

When a PR **with pending changesets** merges into `main`, CI runs `changeset version`, commits the bump, publishes to npm, pushes tags, and opens a GitHub Release in one go.

PRs without changesets (bypass or docs-only) do not trigger a release.
