# Vitek JS + React Example

Example demonstrating the use of Vitek with React in JavaScript (without TypeScript). This example shows how to use the plugin with React while maintaining JavaScript simplicity.

## Features

- ✅ **JavaScript with React**: React using JSX, without TypeScript
- ✅ **Generated services**: Vitek generates JavaScript functions to call the API
- ✅ **Basic routes**: Simple route demonstrations
- ✅ **Dynamic parameters**: Example with `[id]`
- ✅ **Query parameters**: Query params demonstration
- ✅ **HTTP methods**: GET and POST

## Structure

```
src/
  ├── api/                    # API file-based
  │   ├── health.get.js       # GET /api/health
  │   ├── users/
  │   │   └── [id].get.js     # GET /api/users/:id
  │   └── posts/
  │       ├── index.get.js    # GET /api/posts
  │       └── index.post.js   # POST /api/posts
  ├── App.jsx                 # Main React component
  └── main.jsx                # Entry point
```

## Installation

**Important**: Before installing the example dependencies, you need to build the plugin at the project root:

```bash
# At the project root (vitek-plugin/)
cd ../..
npm run build
# or
pnpm build

# Then, in the example directory
cd examples/js-react
npm install
# or
pnpm install
```

## Development

```bash
npm run dev
# or
pnpm dev
```

Visit `http://localhost:5173` to see the React application with endpoint documentation.

## Endpoints

- `GET /api/health` - Health check
- `GET /api/users/:id` - Get user by ID
- `GET /api/posts?limit=5&offset=0` - List posts (with query params)
- `POST /api/posts` - Create post (with body)

## How to Use the Endpoints

### Option 1: Using Fetch API directly

```javascript
// GET /api/health
const health = await fetch('/api/health').then(res => res.json());

// GET /api/users/:id
const user = await fetch('/api/users/123').then(res => res.json());

// GET /api/posts with query params
const posts = await fetch('/api/posts?limit=5&offset=0').then(res => res.json());

// POST /api/posts
const newPost = await fetch('/api/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'My Post',
    content: 'Post content',
    authorId: 1,
  }),
}).then(res => res.json());
```

### Option 2: Using generated services

Vitek automatically generates functions in `src/api.services.js`:

```javascript
import { getHealth, getUsersId, getPosts, postPosts } from './api.services.js';

// GET /api/health
const health = await getHealth();

// GET /api/users/:id
const user = await getUsersId({ id: '123' });

// GET /api/posts
const posts = await getPosts();

// POST /api/posts
const newPost = await postPosts({
  title: 'My Post',
  content: 'Post content',
  authorId: 1,
});
```

### Example with React Hooks

```jsx
import { useState, useEffect } from 'react';
import { getHealth, getUsersId } from './api.services.js';

function MyComponent() {
  const [health, setHealth] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadData() {
      const healthData = await getHealth();
      setHealth(healthData);
      
      const userData = await getUsersId({ id: '123' });
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
}
```

## Generated Services

Vitek automatically generates the `src/api.services.js` file with functions to call the API:

```javascript
// Example usage of generated services
import { getHealth, getUsersById, getPosts, postPosts } from './api.services';

// GET /api/health
const health = await getHealth();

// GET /api/users/:id
const user = await getUsersById({ id: '123' });

// GET /api/posts?limit=5
const posts = await getPosts({ limit: 5, offset: 0 });

// POST /api/posts
const newPost = await postPosts({
  title: 'My Post',
  content: 'Content',
  authorId: 1,
});
```

**Note**: In JavaScript, the services don't have TypeScript types, but still provide convenient functions to call the API.

## What This Example Demonstrates

This example demonstrates:

1. **React without TypeScript**: Perfect for React projects that prefer JavaScript
2. **Generated services**: Even without types, Vitek generates useful functions
3. **Simplicity**: Pure JavaScript, easy to understand
4. **React integration**: Demonstrates how to use Vitek in a React application

## Comparison with Other Examples

- **basic-js**: Minimal example in pure JavaScript, without frameworks
- **js-react** (this): Example with React in JavaScript (without TypeScript)
- **typescript-react**: Complete example with TypeScript and React, showing all features

## When to Use This Example

Use this example when you want to:
- Use React without TypeScript
- See how Vitek works with React
- Understand generated services in JavaScript
- Have an intermediate example between basic and complete
