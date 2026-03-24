# Platform — `vitek generate crud`

`vitek.platform.json` sets `features.dataGenerators: true`. The **build** script runs:

```bash
vitek generate crud GenItem --adapter prisma --out src/api/genitems
```

Generated files are gitignored; CI runs `pnpm build` before tests so routes exist.

See [Data Generators](../../docs/guide/data-generators.md).
