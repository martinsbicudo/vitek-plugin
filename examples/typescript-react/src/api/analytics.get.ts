/**
 * Analytics endpoint (query only)
 * GET /api/analytics?startDate=2024-01-01&endDate=2024-12-31&metric=views
 */

import type { VitekContext } from 'vitek-plugin';

export type Query = {
  startDate: string;
  endDate: string;
  metric: 'views' | 'clicks' | 'conversions';
  groupBy?: 'day' | 'week' | 'month';
};

export default async function handler(context: VitekContext) {
  const { query } = context;
  
  return {
    startDate: query.startDate,
    endDate: query.endDate,
    metric: query.metric,
    groupBy: query.groupBy || 'day',
    data: [
      { date: query.startDate, value: 100 },
      { date: query.endDate, value: 200 },
    ],
  };
}

