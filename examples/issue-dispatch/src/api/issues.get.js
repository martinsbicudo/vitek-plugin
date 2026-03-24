import { getRecentIssues } from '../lib/issue-buffer';
export default function handler(_ctx) {
    return { issues: getRecentIssues() };
}
