import { getMessage } from '../lib/nested';

export default function handler() {
  return {
    message: getMessage(),
    from: 'nested/index -> helper',
  };
}
