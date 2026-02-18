# Development

## Building the Plugin

From the project root:

```bash
npm run build
# or
pnpm build
```

This runs the TypeScript compiler and outputs to `dist/`.

## Development Mode

To work on the plugin with automatic rebuilds on change:

```bash
npm run dev
# or
pnpm dev
```

This runs the TypeScript compiler in watch mode. Use [npm link](https://docs.npmjs.com/cli/v9/commands/npm-link) to test the plugin in another Vite project while developing (see [Contributing](/contributing)).
