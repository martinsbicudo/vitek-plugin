import type { VitekContext } from 'vitek-plugin';
import { getApiRequestCount } from '../lib/api-metrics';

export default function handler(_ctx: VitekContext) {
  return { apiRequests: getApiRequestCount() };
}
