/**
 * Get one SKU by id.
 *
 * @summary Stock by SKU
 * @tag Stock
 * @param sku - Product SKU
 * @response 200 {object} Item
 * @response 404 - Unknown SKU
 */
import type { VitekContext } from 'vitek-plugin';
import { NotFoundError } from 'vitek-plugin';
import { getBySku } from '../../lib/store';

export default function handler(ctx: VitekContext) {
  const item = getBySku(ctx.params.sku);
  if (!item) {
    throw new NotFoundError('SKU not found');
  }
  return { item };
}
