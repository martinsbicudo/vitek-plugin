import { useCallback, useEffect, useState } from 'react';
import { getHealth, getStock } from './api.services';
import { connectAlerts } from './socket.services';
import { API_BASE_PATH, type MovementsPostBody } from './api.types';

type StockRow = { sku: string; name: string; quantity: number; minStock: number };

export default function App() {
  const [health, setHealth] = useState<unknown>(null);
  const [items, setItems] = useState<StockRow[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [sku, setSku] = useState('SKU-100');
  const [kind, setKind] = useState<'in' | 'out'>('out');
  const [qty, setQty] = useState(1);
  const [moveErr, setMoveErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [h, s] = await Promise.all([getHealth(), getStock()]);
    setHealth(h);
    setItems((s as { items: StockRow[] }).items ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const ws = connectAlerts();
    ws.onmessage = (ev) => {
      setAlerts((prev) => [String(ev.data), ...prev].slice(0, 12));
    };
    return () => ws.close();
  }, []);

  async function onMove(e: React.FormEvent) {
    e.preventDefault();
    setMoveErr(null);
    const body: MovementsPostBody = { sku, kind, quantity: qty };
    const res = await fetch(`${API_BASE_PATH}/movements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMoveErr(`${res.status} — ${JSON.stringify(data)}`);
      return;
    }
    await load();
  }

  return (
    <div
      style={{
        padding: '1.5rem',
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '960px',
        margin: '0 auto',
        lineHeight: 1.5,
      }}
    >
      <h1 style={{ marginTop: 0 }}>StockPulse</h1>
      <p style={{ color: '#444' }}>
        Vitek showcase: REST stock via generated <code>api.services.ts</code>, low-stock stream via{' '}
        <code>socket.services.ts</code> (<code>connectAlerts</code>), plus OpenAPI + AsyncAPI at{' '}
        <code>/api-docs.html</code>.
      </p>

      <section style={{ marginTop: '1.5rem' }}>
        <h2>Health</h2>
        <pre style={{ background: '#f4f4f5', padding: '0.75rem', borderRadius: 6, overflow: 'auto' }}>
          {JSON.stringify(health, null, 2)}
        </pre>
      </section>

      <section style={{ marginTop: '1.5rem' }}>
        <h2>Stock</h2>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>SKU</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Name</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc' }}>Qty</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc' }}>Min</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.sku}>
                <td style={{ padding: '0.35rem 0' }}>{row.sku}</td>
                <td>{row.name}</td>
                <td style={{ textAlign: 'right' }}>{row.quantity}</td>
                <td style={{ textAlign: 'right' }}>{row.minStock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: '1.5rem' }}>
        <h2>Record movement</h2>
        <form onSubmit={onMove} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <label>
            SKU{' '}
            <select value={sku} onChange={(e) => setSku(e.target.value)}>
              {items.map((x) => (
                <option key={x.sku} value={x.sku}>
                  {x.sku}
                </option>
              ))}
            </select>
          </label>
          <label>
            Kind{' '}
            <select value={kind} onChange={(e) => setKind(e.target.value as 'in' | 'out')}>
              <option value="in">in</option>
              <option value="out">out</option>
            </select>
          </label>
          <label>
            Qty{' '}
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value) || 1)}
              style={{ width: 72 }}
            />
          </label>
          <button type="submit">Apply</button>
        </form>
        {moveErr && <p style={{ color: '#b91c1c' }}>{moveErr}</p>}
      </section>

      <section style={{ marginTop: '1.5rem' }}>
        <h2>WebSocket alerts</h2>
        <p style={{ fontSize: '0.9rem', color: '#555' }}>
          Uses <code>connectAlerts()</code>. Try outbound movements on <code>SKU-200</code> (already below min) or reduce
          any SKU under its minimum.
        </p>
        <ul style={{ paddingLeft: '1.2rem' }}>
          {alerts.length === 0 ? <li style={{ color: '#888' }}>No messages yet.</li> : null}
          {alerts.map((a, i) => (
            <li key={`${i}-${a}`} style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
              {a}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
