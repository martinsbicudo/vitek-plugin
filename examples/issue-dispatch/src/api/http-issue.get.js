import { NotFoundError } from 'vitek-plugin';
export default function handler() {
    throw new NotFoundError('Demo HTTP-level issue (warning)');
}
