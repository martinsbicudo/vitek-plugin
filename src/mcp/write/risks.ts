import type { VitekManifest } from '../../core/introspection/manifest.js';

function patternPrefix(pattern: string): string {
  const idx = pattern.indexOf('/');
  return idx === -1 ? pattern : pattern.slice(0, idx);
}

export function computeRouteRisks(manifest: VitekManifest, routePattern: string, method: string): string[] {
  const risks: string[] = [];
  const prefix = patternPrefix(routePattern);
  const scoped = manifest.middlewares.filter(
    (m) => m.basePattern !== '' && (routePattern === m.basePattern || routePattern.startsWith(m.basePattern + '/'))
  );
  if (scoped.length === 0 && prefix !== '' && manifest.middlewares.every((m) => m.basePattern === '')) {
    risks.push(`No route-scoped middleware under "${prefix}"; only global middleware applies.`);
  }
  const globalMw = manifest.middlewares.filter((m) => m.basePattern === '').length;
  if (globalMw === 0) {
    risks.push('No global middleware registered.');
  }
  if (method === 'post' || method === 'put' || method === 'patch') {
    risks.push('Validate request body with validateBody / validation rules where appropriate.');
  }
  return risks;
}
