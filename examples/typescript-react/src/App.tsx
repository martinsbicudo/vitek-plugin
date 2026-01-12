function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Vitek TypeScript + React Example</h1>
      <p style={{ color: '#666' }}>Demonstrating all Vitek features with TypeScript and React</p>
      
      <section style={{ marginTop: '2rem', padding: '1rem', background: '#e8f5e9', borderRadius: '8px' }}>
        <h2>📚 How to Use the Endpoints</h2>
        
        <h3 style={{ marginTop: '1rem' }}>Using Generated Services (Recommended)</h3>
        <pre style={{ background: '#fff', padding: '1rem', borderRadius: '4px', overflowX: 'auto', fontSize: '0.85rem' }}>
{`import { getHealth, getUsersById, getPosts, postPosts } from './api.services';

// GET /api/health
const health = await getHealth();

// GET /api/users/:id (with type-safety)
const user = await getUsersById({ id: '123' });

// GET /api/posts (with typed query params)
const posts = await getPosts({ limit: 10, offset: 0 });

// POST /api/posts (with typed body)
const newPost = await postPosts({
  title: 'My Post',
  content: 'Post content',
  authorId: 1,
  tags: ['tech', 'vite'],
});`}
        </pre>

        <h3 style={{ marginTop: '1.5rem' }}>Example with React Hooks</h3>
        <pre style={{ background: '#fff', padding: '1rem', borderRadius: '4px', overflowX: 'auto', fontSize: '0.85rem' }}>
{`import { useState, useEffect } from 'react';
import { getHealth, getUsersById } from './api.services';

function MyComponent() {
  const [health, setHealth] = useState<Awaited<ReturnType<typeof getHealth>> | null>(null);
  const [user, setUser] = useState<Awaited<ReturnType<typeof getUsersById>> | null>(null);

  useEffect(() => {
    async function loadData() {
      const healthData = await getHealth();
      setHealth(healthData);
      
      const userData = await getUsersById({ id: '123' });
      setUser(userData);
    }
    loadData();
  }, []);

  return (
    <div>
      <pre>{JSON.stringify(health, null, 2)}</pre>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}`}
        </pre>

        <h3 style={{ marginTop: '1.5rem' }}>Using Fetch API directly</h3>
        <pre style={{ background: '#fff', padding: '1rem', borderRadius: '4px', overflowX: 'auto', fontSize: '0.85rem' }}>
{`// GET /api/health
const health = await fetch('/api/health').then(res => res.json());

// GET /api/users/:id
const user = await fetch('/api/users/123').then(res => res.json());

// POST /api/posts
const newPost = await fetch('/api/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'My Post',
    content: 'Post content',
    authorId: 1,
  }),
}).then(res => res.json());`}
        </pre>

        <h3 style={{ marginTop: '1.5rem' }}>Available Routes</h3>
        <ul style={{ lineHeight: '1.8', marginTop: '0.5rem' }}>
          <li><strong>GET</strong> /api/health</li>
          <li><strong>GET</strong> /api/users/:id</li>
          <li><strong>POST</strong> /api/users/:id</li>
          <li><strong>PUT</strong> /api/users/:id</li>
          <li><strong>PATCH</strong> /api/users/:id</li>
          <li><strong>DELETE</strong> /api/users/:id</li>
          <li><strong>GET</strong> /api/posts (with query params)</li>
          <li><strong>POST</strong> /api/posts</li>
          <li><strong>GET</strong> /api/posts/:id</li>
          <li><strong>PUT</strong> /api/posts/:id</li>
          <li><strong>DELETE</strong> /api/posts/:id</li>
          <li><strong>GET</strong> /api/posts/*ids (catch-all)</li>
          <li><strong>GET</strong> /api/comments/:postId/:commentId</li>
          <li><strong>DELETE</strong> /api/comments/:postId/:commentId</li>
        </ul>

        <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
          <strong>Note:</strong> The <code>api.types.ts</code> and <code>api.services.ts</code> files are automatically generated when you run the server.
        </p>
      </section>
    </div>
  );
}

export default App;

