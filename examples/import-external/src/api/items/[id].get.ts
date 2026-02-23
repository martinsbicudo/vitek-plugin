import { getGreeting } from '../../lib/greeting';

export default function handler(_context: { params: { id: string } }) {
  const { id } = _context.params;
  return {
    id,
    message: getGreeting(`item-${id}`),
  };
}
