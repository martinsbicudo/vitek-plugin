# Vitek Basic JS Example

Basic example demonstrating the use of Vitek in pure JavaScript, without frameworks or TypeScript. This example shows the essentials of the plugin in a simple and straightforward way.

## Features

- ✅ **Pure JavaScript**: No TypeScript, no frameworks
- ✅ **Static HTML**: Simple interface with fetch API
- ✅ **Basic routes**: Simple route demonstrations
- ✅ **Dynamic parameters**: Example with `[id]`
- ✅ **Query parameters**: Query params demonstration
- ✅ **HTTP methods**: GET and POST

## Structure

```
src/
  └── api/                    # API file-based
      ├── health.get.js       # GET /api/health
      ├── users/
      │   └── [id].get.js     # GET /api/users/:id
      └── posts/
          ├── index.get.js    # GET /api/posts
          └── index.post.js   # POST /api/posts
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
cd examples/basic-js
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

Visit `http://localhost:5173` to see the HTML page with endpoint documentation.

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

## What This Example Demonstrates

This is the simplest example and demonstrates:

1. **Simplicity**: No extra dependencies, just Vite and Vitek
2. **Pure JavaScript**: Perfect for those who want to start without TypeScript
3. **Static HTML**: Simple interface without frameworks
4. **Basic concepts**: Focuses on the fundamental concepts of Vitek

## Comparison with Other Examples

- **basic-js** (this): Minimal example in pure JavaScript, without frameworks
- **js-react**: Example with React in JavaScript (without TypeScript)
- **typescript-react**: Complete example with TypeScript and React, showing all features

## When to Use This Example

Use this example when you want to:
- Understand the basic concepts of Vitek
- Start without TypeScript
- See a simple example without frameworks
- Learn the file-based route structure
