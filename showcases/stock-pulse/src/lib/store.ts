export type StockItem = {
  sku: string;
  name: string;
  quantity: number;
  minStock: number;
};

export type LowStockAlert = {
  type: 'low_stock';
  sku: string;
  name: string;
  quantity: number;
  minStock: number;
};

const items: StockItem[] = [
  { sku: 'SKU-100', name: 'Widget A', quantity: 40, minStock: 10 },
  { sku: 'SKU-200', name: 'Bolt B', quantity: 5, minStock: 15 },
  { sku: 'SKU-300', name: 'Cable C', quantity: 100, minStock: 20 },
];

const alertSenders = new Set<(data: string) => void>();

export function registerAlertSender(send: (data: string) => void): () => void {
  alertSenders.add(send);
  return () => {
    alertSenders.delete(send);
  };
}

function broadcastAlert(alert: LowStockAlert): void {
  const payload = JSON.stringify(alert);
  for (const send of alertSenders) {
    send(payload);
  }
}

export function listStock(): StockItem[] {
  return items.map((i) => ({ ...i }));
}

export function getBySku(sku: string): StockItem | undefined {
  return items.find((i) => i.sku === sku);
}

export function recordMovement(input: {
  sku: string;
  kind: 'in' | 'out';
  quantity: number;
}): { item: StockItem; lowStockAlert?: LowStockAlert } {
  const item = getBySku(input.sku);
  if (!item) {
    throw new Error('SKU_NOT_FOUND');
  }
  if (input.quantity <= 0 || !Number.isFinite(input.quantity)) {
    throw new Error('INVALID_QUANTITY');
  }
  const delta = input.kind === 'in' ? input.quantity : -input.quantity;
  const next = item.quantity + delta;
  if (next < 0) {
    throw new Error('INSUFFICIENT_STOCK');
  }
  item.quantity = next;
  const snapshot: StockItem = { ...item };
  let lowStockAlert: LowStockAlert | undefined;
  if (snapshot.quantity < snapshot.minStock) {
    lowStockAlert = {
      type: 'low_stock',
      sku: snapshot.sku,
      name: snapshot.name,
      quantity: snapshot.quantity,
      minStock: snapshot.minStock,
    };
    broadcastAlert(lowStockAlert);
  }
  return { item: snapshot, lowStockAlert };
}
