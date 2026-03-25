import type { VitekContext } from 'vitek-plugin';

export default function handler(_ctx: VitekContext) {
  throw new Error('reliable-api demo: intentional unhandled error (see onError in vite.config)');
}
