/**
 * Register stock in or out. Emits a **low_stock** alert on the `alerts` WebSocket when quantity falls below minimum.
 *
 * @summary Record movement
 * @tag Stock
 * @response 200 {object} Updated item
 * @response 400 - Unknown SKU or invalid quantity
 * @response 409 - Not enough stock for outbound movement
 * @response 422 - Validation failed
 */
import type { VitekContext } from 'vitek-plugin';
import { validateBody, BadRequestError, ConflictError } from 'vitek-plugin';
import { recordMovement } from '../lib/store';

export type Body = {
  sku: string;
  kind: 'in' | 'out';
  quantity: number;
};

const schema = {
  sku: { type: 'string' as const, required: true },
  kind: { type: 'string' as const, required: true },
  quantity: { type: 'number' as const, required: true },
};

export default function handler(ctx: VitekContext) {
  const body = validateBody(ctx.body, schema) as Body;
  if (body.kind !== 'in' && body.kind !== 'out') {
    throw new BadRequestError('kind must be "in" or "out"');
  }
  try {
    const { item, lowStockAlert } = recordMovement({
      sku: body.sku,
      kind: body.kind,
      quantity: body.quantity,
    });
    return { item, lowStockAlert: lowStockAlert ?? null };
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === 'SKU_NOT_FOUND') {
        throw new BadRequestError('Unknown sku');
      }
      if (e.message === 'INVALID_QUANTITY') {
        throw new BadRequestError('quantity must be a positive number');
      }
      if (e.message === 'INSUFFICIENT_STOCK') {
        throw new ConflictError('Insufficient stock for this outbound movement');
      }
    }
    throw e;
  }
}
