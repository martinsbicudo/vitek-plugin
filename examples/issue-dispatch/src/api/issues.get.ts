import type { VitekContext } from 'vitek-plugin';
import { getRecentIssues } from '../lib/issue-buffer';

export default function handler(_ctx: VitekContext) {
  return { issues: getRecentIssues() };
}
