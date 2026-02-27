import type { VitekContext } from 'vitek-plugin';

export default function handler(_ctx: VitekContext) {
  return { status: 'ok', ts: true };
}
