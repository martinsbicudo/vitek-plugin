import { getGreeting } from '../lib/greeting';

export default function handler() {
  return {
    status: 'ok',
    greeting: getGreeting(),
    timestamp: new Date().toISOString(),
  };
}
