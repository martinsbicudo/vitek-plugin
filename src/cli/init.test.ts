import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runInit, parseInitArgs, injectVitekIntoConfig } from './init.js';

describe('parseInitArgs', () => {
  it('returns force false when no args', () => {
    process.argv = ['node', 'vitek', 'init'];
    expect(parseInitArgs().force).toBe(false);
  });

  it('returns force true when --force', () => {
    process.argv = ['node', 'vitek', 'init', '--force'];
    expect(parseInitArgs().force).toBe(true);
  });

  it('returns force true when -f', () => {
    process.argv = ['node', 'vitek', 'init', '-f'];
    expect(parseInitArgs().force).toBe(true);
  });
});

describe('injectVitekIntoConfig', () => {
  it('returns null when vitek is already present', () => {
    const content = "import { vitek } from 'vitek-plugin';\nexport default defineConfig({ plugins: [vitek()] });";
    expect(injectVitekIntoConfig(content)).toBeNull();
  });

  it('adds import and vitek() to plugins when missing', () => {
    const content = `import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
});
`;
    const result = injectVitekIntoConfig(content);
    expect(result).not.toBeNull();
    expect(result).toContain("import { vitek } from 'vitek-plugin'");
    expect(result).toContain('vitek(), ');
    expect(result).toMatch(/plugins:\s*\[\s*vitek\(\)/);
  });

  it('returns null when plugins array is missing', () => {
    const content = 'export default { root: "." }';
    expect(injectVitekIntoConfig(content)).toBeNull();
  });
});

describe('runInit', () => {
  let tmpDir: string;
  const originalCwd = process.cwd();

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vitek-init-test-'));
  });

  afterEach(() => {
    process.chdir(originalCwd);
    try {
      fs.rmSync(tmpDir, { recursive: true });
    } catch {
      // ignore
    }
  });

  it('creates src/api and health.get.ts', async () => {
    process.chdir(tmpDir);
    await runInit();
    const healthPath = path.join(tmpDir, 'src', 'api', 'health.get.ts');
    expect(fs.existsSync(healthPath)).toBe(true);
    const content = fs.readFileSync(healthPath, 'utf-8');
    expect(content).toContain('export default function handler()');
    expect(content).toContain('ok: true');
  });

  it('does not overwrite health.get.ts on second run without --force', async () => {
    process.chdir(tmpDir);
    process.argv = ['node', 'vitek', 'init'];
    await runInit();
    const healthPath = path.join(tmpDir, 'src', 'api', 'health.get.ts');
    fs.writeFileSync(healthPath, '// custom content', 'utf-8');
    process.argv = ['node', 'vitek', 'init'];
    await runInit();
    expect(fs.readFileSync(healthPath, 'utf-8')).toBe('// custom content');
  });

  it('overwrites health.get.ts when --force', async () => {
    process.chdir(tmpDir);
    await runInit();
    const healthPath = path.join(tmpDir, 'src', 'api', 'health.get.ts');
    fs.writeFileSync(healthPath, '// custom', 'utf-8');
    process.argv = ['node', 'vitek', 'init', '--force'];
    await runInit();
    expect(fs.readFileSync(healthPath, 'utf-8')).toContain('export default function handler()');
  });

  it('adds vitek to existing vite.config.js', async () => {
    process.chdir(tmpDir);
    fs.mkdirSync(path.join(tmpDir, 'src', 'api'), { recursive: true });
    const configPath = path.join(tmpDir, 'vite.config.js');
    fs.writeFileSync(
      configPath,
      `import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
});
`,
      'utf-8'
    );
    await runInit();
    const content = fs.readFileSync(configPath, 'utf-8');
    expect(content).toContain("import { vitek } from 'vitek-plugin'");
    expect(content).toContain('vitek(), ');
  });

  it('does not duplicate vitek in config on second run', async () => {
    process.chdir(tmpDir);
    fs.mkdirSync(path.join(tmpDir, 'src', 'api'), { recursive: true });
    const configPath = path.join(tmpDir, 'vite.config.js');
    fs.writeFileSync(
      configPath,
      `import { defineConfig } from 'vite';
import { vitek } from 'vitek-plugin';

export default defineConfig({
  plugins: [vitek()],
});
`,
      'utf-8'
    );
    await runInit();
    const content = fs.readFileSync(configPath, 'utf-8');
    const vitekCount = (content.match(/vitek/g) || []).length;
    expect(vitekCount).toBeLessThanOrEqual(3); // import + two in plugins
  });
});
