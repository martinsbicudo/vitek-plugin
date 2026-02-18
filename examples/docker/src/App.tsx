function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Vitek Docker Example</h1>
      <p style={{ color: '#666' }}>TypeScript + React with Docker and docker-compose. Same endpoints as basic-js and js-react.</p>

      <section style={{ marginTop: '2rem', padding: '1rem', background: '#e8f5e9', borderRadius: '8px' }}>
        <h2>How to Use the Endpoints</h2>

        <h3 style={{ marginTop: '1rem' }}>Option 1: Direct Fetch API</h3>
        <pre style={{ background: '#fff', padding: '1rem', borderRadius: '4px', overflowX: 'auto', fontSize: '0.85rem' }}>
{`// GET /api/health
const health = await fetch('/api/health').then(res => res.json());

// GET /api/users/:id
const user = await fetch('/api/users/123').then(res => res.json());

// GET /api/posts
const posts = await fetch('/api/posts?limit=5').then(res => res.json());

// POST /api/posts
const newPost = await fetch('/api/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'My Post', content: 'Content', authorId: 1 }),
}).then(res => res.json());`}
        </pre>

        <h3 style={{ marginTop: '1.5rem' }}>Option 2: Generated services</h3>
        <pre style={{ background: '#fff', padding: '1rem', borderRadius: '4px', overflowX: 'auto', fontSize: '0.85rem' }}>
{`import { getHealth, getUsersId, getPosts, postPosts } from './api.services';

const health = await getHealth();
const user = await getUsersId({ id: '123' });
const posts = await getPosts({ limit: 5 });
const newPost = await postPosts({ title: 'My Post', content: 'Content', authorId: 1 });`}
        </pre>

        <h3 style={{ marginTop: '1.5rem' }}>Available Routes</h3>
        <ul style={{ lineHeight: '1.8', marginTop: '0.5rem' }}>
          <li><strong>GET</strong> /api/health</li>
          <li><strong>GET</strong> /api/users/:id</li>
          <li><strong>GET</strong> /api/posts (with query params limit, offset)</li>
          <li><strong>POST</strong> /api/posts</li>
        </ul>

        <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
          <strong>Note:</strong> <code>api.types.ts</code> and <code>api.services.ts</code> are generated when you run the server.
        </p>
      </section>
    </div>
  );
}

export default App;
