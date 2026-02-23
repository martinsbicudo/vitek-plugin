import { APP_VERSION } from '../lib/greeting';

export default function handler() {
  return {
    version: APP_VERSION,
    from: 'lib/greeting',
  };
}
