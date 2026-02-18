# Contributing

To contribute to Vitek Plugin, follow these steps.

## 1. Create a branch

```bash
git checkout -b feat/your-new-feature
```

## 2. Make changes and test

Make your changes and, if applicable, add or update tests. Test the plugin in a real app using **npm link**:

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
