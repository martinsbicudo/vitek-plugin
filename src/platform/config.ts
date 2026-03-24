import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

export interface FeatureFlags {
  observability: boolean;
  contracts: boolean;
  mcpWriteTools: boolean;
  issueDispatch: boolean;
  dataGenerators: boolean;
  doctor: boolean;
}

export interface RedactionPolicy {
  stripHeaders: string[];
  stripFields: string[];
}

export type AiProvider = 'openai' | 'anthropic' | 'local';
export type AiMode = 'off' | 'local-only' | 'remote-redacted';

export interface AiAnalyzerConfig {
  enabled: boolean;
  provider: AiProvider;
  model: string;
  mode: AiMode;
  redaction: RedactionPolicy;
}

export interface PlatformConfig {
  features: FeatureFlags;
  ai: AiAnalyzerConfig;
}

const featureFlagsSchema = z.object({
  observability: z.boolean().optional(),
  contracts: z.boolean().optional(),
  mcpWriteTools: z.boolean().optional(),
  issueDispatch: z.boolean().optional(),
  dataGenerators: z.boolean().optional(),
  doctor: z.boolean().optional(),
});

const redactionPolicySchema = z.object({
  stripHeaders: z.array(z.string()).optional(),
  stripFields: z.array(z.string()).optional(),
});

const aiAnalyzerSchema = z.object({
  enabled: z.boolean().optional(),
  provider: z.enum(['openai', 'anthropic', 'local']).optional(),
  model: z.string().min(1).optional(),
  mode: z.enum(['off', 'local-only', 'remote-redacted']).optional(),
  redaction: redactionPolicySchema.optional(),
});

const platformConfigSchema = z.object({
  features: featureFlagsSchema.optional(),
  ai: aiAnalyzerSchema.optional(),
});

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  features: {
    observability: false,
    contracts: false,
    mcpWriteTools: false,
    issueDispatch: false,
    dataGenerators: false,
    doctor: false,
  },
  ai: {
    enabled: false,
    provider: 'openai',
    model: 'gpt-4.1-mini',
    mode: 'off',
    redaction: {
      stripHeaders: ['authorization', 'cookie'],
      stripFields: ['password', 'token', 'secret'],
    },
  },
};

export function mergePlatformConfig(raw: unknown): PlatformConfig {
  const parsed = platformConfigSchema.parse(raw);
  return {
    features: {
      observability: parsed.features?.observability ?? DEFAULT_PLATFORM_CONFIG.features.observability,
      contracts: parsed.features?.contracts ?? DEFAULT_PLATFORM_CONFIG.features.contracts,
      mcpWriteTools: parsed.features?.mcpWriteTools ?? DEFAULT_PLATFORM_CONFIG.features.mcpWriteTools,
      issueDispatch: parsed.features?.issueDispatch ?? DEFAULT_PLATFORM_CONFIG.features.issueDispatch,
      dataGenerators: parsed.features?.dataGenerators ?? DEFAULT_PLATFORM_CONFIG.features.dataGenerators,
      doctor: parsed.features?.doctor ?? DEFAULT_PLATFORM_CONFIG.features.doctor,
    },
    ai: {
      enabled: parsed.ai?.enabled ?? DEFAULT_PLATFORM_CONFIG.ai.enabled,
      provider: parsed.ai?.provider ?? DEFAULT_PLATFORM_CONFIG.ai.provider,
      model: parsed.ai?.model ?? DEFAULT_PLATFORM_CONFIG.ai.model,
      mode: parsed.ai?.mode ?? DEFAULT_PLATFORM_CONFIG.ai.mode,
      redaction: {
        stripHeaders: parsed.ai?.redaction?.stripHeaders ?? DEFAULT_PLATFORM_CONFIG.ai.redaction.stripHeaders,
        stripFields: parsed.ai?.redaction?.stripFields ?? DEFAULT_PLATFORM_CONFIG.ai.redaction.stripFields,
      },
    },
  };
}

export function loadPlatformConfig(root: string): PlatformConfig {
  const configPath = path.join(root, 'vitek.platform.json');
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_PLATFORM_CONFIG, features: { ...DEFAULT_PLATFORM_CONFIG.features }, ai: { ...DEFAULT_PLATFORM_CONFIG.ai, redaction: { ...DEFAULT_PLATFORM_CONFIG.ai.redaction } } };
  }

  try {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return mergePlatformConfig(raw);
  } catch {
    return { ...DEFAULT_PLATFORM_CONFIG, features: { ...DEFAULT_PLATFORM_CONFIG.features }, ai: { ...DEFAULT_PLATFORM_CONFIG.ai, redaction: { ...DEFAULT_PLATFORM_CONFIG.ai.redaction } } };
  }
}

export function isFeatureEnabled(config: PlatformConfig, feature: keyof FeatureFlags): boolean {
  return config.features[feature] === true;
}
