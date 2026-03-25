import { useCallback, useEffect, useState } from 'react';
import { API_BASE_PATH, type ActivityGetQuery } from './api.types';
import { getActivity, getHealth, getTeams, getTeamsIdTasks, postTasks } from './api.services';

type Team = { id: string; name: string };

export default function App() {
  const [health, setHealth] = useState<unknown>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState('eng');
  const [tasks, setTasks] = useState<unknown[]>([]);
  const [activity, setActivity] = useState<unknown[]>([]);
  const [title, setTitle] = useState('');
  const [adminOk, setAdminOk] = useState<unknown>(null);
  const [adminErr, setAdminErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [h, t, a] = await Promise.all([
      getHealth(),
      getTeams(),
      getActivity({ limit: 10 } satisfies ActivityGetQuery),
    ]);
    setHealth(h);
    setTeams((t as { teams: Team[] }).teams ?? []);
    setActivity((a as { activity: unknown[] }).activity ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      const res = await getTeamsIdTasks({ id: teamId });
      setTasks((res as { tasks: unknown[] }).tasks ?? []);
    })();
  }, [teamId]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await postTasks({ teamId, title: title.trim() }, undefined);
    setTitle('');
    await load();
    const res = await getTeamsIdTasks({ id: teamId });
    setTasks((res as { tasks: unknown[] }).tasks ?? []);
  }

  async function loadAdmin(withHeader: boolean) {
    setAdminErr(null);
    setAdminOk(null);
    const headers: Record<string, string> = {};
    if (withHeader) headers['X-User-Id'] = 'showcase-admin';
    const res = await fetch(`${API_BASE_PATH}/admin/summary`, { headers });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAdminErr(`${res.status} — ${JSON.stringify(body)}`);
      return;
    }
    setAdminOk(body);
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
      <h1 style={{ marginTop: 0 }}>OpsBoard</h1>
      <p style={{ color: '#444' }}>
        Vitek showcase: file-based API, generated <code>api.services.ts</code>, OpenAPI, hierarchical
        middleware on <code>/api/admin/*</code>, validation on <code>POST /api/tasks</code>.
      </p>

      <section style={{ marginTop: '1.5rem' }}>
        <h2>Health</h2>
        <pre style={{ background: '#f4f4f5', padding: '0.75rem', borderRadius: 6, overflow: 'auto' }}>
          {JSON.stringify(health, null, 2)}
        </pre>
      </section>

      <section style={{ marginTop: '1.5rem' }}>
        <h2>Tasks by team</h2>
        <label>
          Team{' '}
          <select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            {teams.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <ul>
          {tasks.map((row) => (
            <li key={JSON.stringify(row)}>{JSON.stringify(row)}</li>
          ))}
        </ul>
        <form onSubmit={onCreate} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New task title"
            style={{ minWidth: '240px', padding: '0.35rem 0.5rem' }}
          />
          <button type="submit">Create task</button>
        </form>
      </section>

      <section style={{ marginTop: '1.5rem' }}>
        <h2>Recent activity</h2>
        <ul>
          {activity.map((row, i) => (
            <li key={i}>{JSON.stringify(row)}</li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: '1.5rem' }}>
        <h2>Admin summary (mock auth)</h2>
        <p style={{ fontSize: '0.9rem', color: '#555' }}>
          <code>GET /api/admin/summary</code> requires header <code>X-User-Id</code> (see{' '}
          <code>src/api/admin/middleware.ts</code>).
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => loadAdmin(true)}>
            With X-User-Id
          </button>
          <button type="button" onClick={() => loadAdmin(false)}>
            Without header
          </button>
        </div>
        {adminOk != null && (
          <pre style={{ background: '#ecfdf5', padding: '0.75rem', borderRadius: 6, marginTop: 8 }}>
            {JSON.stringify(adminOk, null, 2)}
          </pre>
        )}
        {adminErr && <p style={{ color: '#b91c1c' }}>{adminErr}</p>}
      </section>

      <section style={{ marginTop: '2rem', fontSize: '0.85rem', color: '#666' }}>
        <p>
          Open <a href="/api-docs.html">api-docs.html</a> for Swagger. Production:{' '}
          <code>pnpm run build && pnpm start</code> (vitek-serve).
        </p>
      </section>
    </div>
  );
}
