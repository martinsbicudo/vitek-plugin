function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Vitek JS + React Example</h1>
      <p style={{ color: '#666' }}>Demonstrating the use of Vitek with React in JavaScript</p>
      
      <section style={{ marginTop: '2rem', padding: '1rem', background: '#e8f5e9', borderRadius: '8px' }}>
        <h3>📚 How to Use the Endpoints</h3>
        
        <h4 style={{ marginTop: '1rem' }}>Option 1: Direct Fetch API</h4>
        <pre style={{ background: '#fff', padding: '1rem', borderRadius: '4px', overflowX: 'auto', fontSize: '0.85rem' }}>
{`// GET /api/health
const health = await fetch('/api/health').then(res => res.json());

// GET /api/users/:id
const user = await fetch('/api/users/123').then(res => res.json());

// POST /api/posts
const newPost = await fetch('/api/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'My Post', content: 'Content', authorId: 1 }),
}).then(res => res.json());`}
        </pre>

        <h4 style={{ marginTop: '1.5rem' }}>Option 2: Generated services</h4>
        <pre style={{ background: '#fff', padding: '1rem', borderRadius: '4px', overflowX: 'auto', fontSize: '0.85rem' }}>
{`import { getHealth, getUsersId, postPosts } from './api.services.js';

// GET /api/health
const health = await getHealth();

// GET /api/users/:id
const user = await getUsersId({ id: '123' });

// POST /api/posts
const newPost = await postPosts({ 
  title: 'My Post', 
  content: 'Content', 
  authorId: 1 
});`}
        </pre>

        <h4 style={{ marginTop: '1.5rem' }}>Example with React Hooks</h4>
        <pre style={{ background: '#fff', padding: '1rem', borderRadius: '4px', overflowX: 'auto', fontSize: '0.85rem' }}>
{`import { useState, useEffect } from 'react';
import { getHealth } from './api.services.js';

function MyComponent() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    async function loadData() {
      const data = await getHealth();
      setHealth(data);
    }
    loadData();
  }, []);

  return <pre>{JSON.stringify(health, null, 2)}</pre>;
}`}
        </pre>

        <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
          <strong>Note:</strong> Services are automatically generated in <code>src/api.services.js</code> when you run the server.
        </p>
      </section>
    </div>
  );
}

export default App;
