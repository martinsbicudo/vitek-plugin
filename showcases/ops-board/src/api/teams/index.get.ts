import type { VitekContext } from 'vitek-plugin';
import { listTeams } from '../../lib/store';

export default function handler(_ctx: VitekContext) {
  return { teams: listTeams() };
}
