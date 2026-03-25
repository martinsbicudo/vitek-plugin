/**
 * List all SKUs with current quantity and minimum threshold.
 *
 * @summary List stock levels
 * @tag Stock
 * @response 200 {object} Stock rows
 */
import type { VitekContext } from 'vitek-plugin';
import { listStock } from '../lib/store';

export default function handler(_ctx: VitekContext) {
  return { items: listStock() };
}
