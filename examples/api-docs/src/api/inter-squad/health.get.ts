import type { VitekContext } from 'vitek-plugin';

export default function handler(_context: VitekContext) {
  return {
    status: 'ok',
    service: 'inter-squad',
    timestamp: new Date().toISOString(),
  };
}
