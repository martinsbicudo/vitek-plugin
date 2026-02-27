import { now } from '@lib/now';

export default function handler() {
  return { status: 'ok', at: now() };
}
