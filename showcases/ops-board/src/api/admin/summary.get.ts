import type { VitekContext } from 'vitek-plugin';
import { adminSummary } from '../../lib/store';

export default function handler(_ctx: VitekContext) {
  return adminSummary();
}
