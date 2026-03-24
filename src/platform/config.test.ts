import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  DEFAULT_PLATFORM_CONFIG,
  isFeatureEnabled,
  loadPlatformConfig,
  mergePlatformConfig,
} from './config.js';

describe('mergePlatformConfig', () => {
  it('merges partial config with defaults', () => {
    const config = mergePlatformConfig({
      features: { contracts: true },
      ai: { enabled: true, mode: 'remote-redacted' },
    });
    expect(config.features.contracts).toBe(true);
    expect(config.features.observability).toBe(false);
    expect(config.ai.enabled).toBe(true);
    expect(config.ai.mode).toBe('remote-redacted');
    expect(config.ai.provider).toBe(DEFAULT_PLATFORM_CONFIG.ai.provider);
  });
});

describe('loadPlatformConfig', () => {
  it('returns defaults when config file does not exist', () => {
    const config = loadPlatformConfig(os.tmpdir());
    expect(config).toEqual(DEFAULT_PLATFORM_CONFIG);
  });

  it('reads and validates vitek.platform.json', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vitek-platform-'));
    try {
      fs.writeFileSync(
        path.join(root, 'vitek.platform.json'),
        JSON.stringify({
          features: { observability: true, doctor: true },
          ai: {
            enabled: true,
            provider: 'anthropic',
            model: 'claude-3-5-sonnet',
            mode: 'local-only',
            redaction: { stripHeaders: ['authorization'], stripFields: ['secret'] },
          },
        }),
        'utf-8'
      );
      const config = loadPlatformConfig(root);
      expect(config.features.observability).toBe(true);
      expect(config.features.doctor).toBe(true);
      expect(config.ai.enabled).toBe(true);
      expect(config.ai.provider).toBe('anthropic');
      expect(config.ai.mode).toBe('local-only');
      expect(config.ai.redaction.stripHeaders).toEqual(['authorization']);
      expect(config.ai.redaction.stripFields).toEqual(['secret']);
    } finally {
      fs.rmSync(root, { recursive: true });
    }
  });

  it('falls back to defaults when config is invalid JSON', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vitek-platform-invalid-json-'));
    try {
      fs.writeFileSync(path.join(root, 'vitek.platform.json'), '{ invalid', 'utf-8');
      const config = loadPlatformConfig(root);
      expect(config).toEqual(DEFAULT_PLATFORM_CONFIG);
    } finally {
      fs.rmSync(root, { recursive: true });
    }
  });

  it('falls back to defaults when config schema is invalid', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vitek-platform-invalid-schema-'));
    try {
      fs.writeFileSync(
        path.join(root, 'vitek.platform.json'),
        JSON.stringify({
          features: { contracts: 'yes' },
          ai: { mode: 'remote' },
        }),
        'utf-8'
      );
      const config = loadPlatformConfig(root);
      expect(config).toEqual(DEFAULT_PLATFORM_CONFIG);
    } finally {
      fs.rmSync(root, { recursive: true });
    }
  });
});

describe('isFeatureEnabled', () => {
  it('returns true only for enabled feature', () => {
    const config = mergePlatformConfig({ features: { contracts: true } });
    expect(isFeatureEnabled(config, 'contracts')).toBe(true);
    expect(isFeatureEnabled(config, 'observability')).toBe(false);
  });
});
