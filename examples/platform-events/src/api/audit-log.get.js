import { recentAudit } from '../lib/events-hub';
export default function handler() {
    return { entries: recentAudit() };
}
