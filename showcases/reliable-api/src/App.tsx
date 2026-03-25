import { useCallback, useEffect, useState } from 'react';
import { getHealth, getMetrics, getReportSlow, postWebhooks } from './api.services';
import { API_BASE_PATH } from './api.types';

const INTERNAL_TOKEN = 'reliable-api-demo';

export default function App() {
  const [health, setHealth] = useState<unknown>(null);
  const [metrics, setMetrics] = useState<unknown>(null);
  const [slow, setSlow] = useState<unknown>(null);
  const [webhookOk, setWebhookOk] = useState<string | null>(null);
  const [crashOut, setCrashOut] = useState<string | null>(null);
  const [issues, setIssues] = useState<unknown>(null);
  const [issuesErr, setIssuesErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [h, m, s] = await Promise.all([getHealth(), getMetrics(), getReportSlow()]);
    setHealth(h);
    setMetrics(m);
    setSlow(s);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function sendWebhook() {
    setWebhookOk(null);
    const res = await postWebhooks({ type: 'integration.ping' });
    setWebhookOk(JSON.stringify(res));
  }

  async function hitCrash() {
    setCrashOut(null);
    const res = await fetch(`${API_BASE_PATH}/crash`);
    const text = await res.text();
    setCrashOut(`${res.status} ${text}`);
  }

  async function loadIssues(withToken: boolean) {
    setIssuesErr(null);
    setIssues(null);
    const headers: Record<string, string> = {};
    if (withToken) headers['X-Internal-Token'] = INTERNAL_TOKEN;
    const res = await fetch(`${API_BASE_PATH}/internal/issues`, { headers });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setIssuesErr(`${res.status} ${JSON.stringify(body)}`);
      return;
    }
    setIssues(body);
  }

  return (
    <div
      style={{
        padding: '1.5rem',
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '900px',
        margin: '0 auto',
        lineHeight: 1.5,
      }}
    >
      <h1 style={{ marginTop: 0 }}>ReliableAPI</h1>
      <p style={{ color: '#444' }}>
        Production-oriented showcase: strict CORS, <code>maxBodySize</code>, <code>trustProxy</code>,{' '}
        <code>onError</code>, hierarchical middleware on <code>/api/internal/*</code>,{' '}
        <code>vitek.platform.json</code> (observability + issue dispatch), <code>withSpan</code>, and{' '}
        <code>dist/vitek.config.mjs</code> for <code>vitek-serve</code>.
      </p>

      <section style={{ marginTop: '1.25rem' }}>
        <h2>Health</h2>
        <pre style={{ background: '#f4f4f5', padding: '0.75rem', borderRadius: 6, overflow: 'auto' }}>
          {JSON.stringify(health, null, 2)}
        </pre>
      </section>

      <section style={{ marginTop: '1.25rem' }}>
        <h2>Metrics (API request counter via plugin hook)</h2>
        <pre style={{ background: '#f4f4f5', padding: '0.75rem', borderRadius: 6, overflow: 'auto' }}>
          {JSON.stringify(metrics, null, 2)}
        </pre>
      </section>

      <section style={{ marginTop: '1.25rem' }}>
        <h2>Slow report (withSpan)</h2>
        <pre style={{ background: '#f4f4f5', padding: '0.75rem', borderRadius: 6, overflow: 'auto' }}>
          {JSON.stringify(slow, null, 2)}
        </pre>
      </section>

      <section style={{ marginTop: '1.25rem' }}>
        <h2>Webhook POST</h2>
        <button type="button" onClick={() => void sendWebhook()}>
          POST sample webhook
        </button>
        {webhookOk && <pre style={{ marginTop: '0.5rem' }}>{webhookOk}</pre>}
      </section>

      <section style={{ marginTop: '1.25rem' }}>
        <h2>Crash route (onError)</h2>
        <button type="button" onClick={() => void hitCrash()}>
          GET /api/crash
        </button>
        {crashOut && <pre style={{ marginTop: '0.5rem' }}>{crashOut}</pre>}
      </section>

      <section style={{ marginTop: '1.25rem' }}>
        <h2>Internal issues (middleware)</h2>
        <p style={{ fontSize: '0.9rem', color: '#555' }}>
          Requires header <code>X-Internal-Token: {INTERNAL_TOKEN}</code>
        </p>
        <button type="button" onClick={() => void loadIssues(false)} style={{ marginRight: 8 }}>
          Without token
        </button>
        <button type="button" onClick={() => void loadIssues(true)}>
          With token
        </button>
        {issuesErr && <pre style={{ color: '#b91c1c' }}>{issuesErr}</pre>}
        {issues != null ? (
          <pre style={{ background: '#f4f4f5', padding: '0.75rem', borderRadius: 6, overflow: 'auto' }}>
            {JSON.stringify(issues, null, 2)}
          </pre>
        ) : null}
      </section>
    </div>
  );
}
