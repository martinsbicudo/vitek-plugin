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

## 3. Open a pull request

Before pushing, open a pull request and fill all required fields in the template.

**Important:** You must fill the **Release** section in the PR description with a summary of what the PR changes. This section is required to merge.

## 4. Set the semver label

Apply exactly one of these labels to your PR:

| Label | Use when |
|-------|----------|
| `semver:patch` | Bug fix, performance improvement, docs-only in code |
| `semver:minor` | New feature, new component, backward-compatible change |
| `semver:major` | Breaking change |
| `semver:prerelease` | Prerelease version (e.g. 0.1.0-beta.1) |
| `semver:bypass` | Changes that do not affect the build (e.g. docs, README) |

## After merge

Once the PR is merged with the Release section and a semver label, GitHub Actions will run the build and publish the new version to NPM and create a GitHub Release.
