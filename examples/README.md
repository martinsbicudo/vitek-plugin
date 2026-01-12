# Vitek Plugin Examples

This directory contains complete, working examples demonstrating different use cases of the Vitek plugin. Each example is self-contained and can be run independently.

## 📚 Available Examples

### [basic-js](./basic-js/)

**Pure JavaScript, no frameworks**

The simplest example to get started with Vitek. Perfect for understanding the fundamentals without any framework overhead.

**Key Features:**
- ✅ Pure JavaScript (no TypeScript)
- ✅ No frameworks (no React, Vue, etc.)
- ✅ Simple HTML page with fetch API
- ✅ Basic routes demonstration
- ✅ Generated JavaScript services (`api.services.js`)

**Best for:**
- Learning the basics of Vitek
- Understanding file-based routing
- Projects that want to keep it simple
- Quick prototypes

**Tech Stack:**
- JavaScript
- Vite
- HTML

---

### [js-react](./js-react/)

**JavaScript with React (no TypeScript)**

A practical example showing how to integrate Vitek with React while keeping JavaScript simplicity.

**Key Features:**
- ✅ React with JavaScript (JSX)
- ✅ No TypeScript
- ✅ Generated JavaScript services
- ✅ React Hooks integration examples
- ✅ Intermediate complexity

**Best for:**
- React projects that prefer JavaScript
- Teams not ready for TypeScript
- Learning Vitek with React
- Progressive enhancement from basic-js

**Tech Stack:**
- JavaScript
- React
- Vite
- JSX

---

### [typescript-react](./typescript-react/)

**Complete TypeScript with React**

The most comprehensive example showcasing all Vitek features with full type-safety and advanced patterns.

**Key Features:**
- ✅ Complete TypeScript setup
- ✅ Full type-safety (auto-generated types)
- ✅ React with TypeScript
- ✅ Hierarchical middlewares
- ✅ All HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- ✅ Dynamic parameters (`[id]`, `[...ids]`)
- ✅ Typed Body and Query parameters
- ✅ Generated TypeScript services (`api.services.ts`)
- ✅ Response helpers (custom status codes and headers)
- ✅ HTTP error classes
- ✅ Request validation

**Best for:**
- Production-ready applications
- Teams using TypeScript
- Learning all Vitek features
- Reference implementation

**Tech Stack:**
- TypeScript
- React
- Vite
- TSX

---

## 🚀 Quick Start

### Prerequisites

Before running any example, you need to build the Vitek plugin:

```bash
# From the project root (vitek-plugin/)
npm run build
# or
pnpm build
```

### Running an Example

1. Navigate to the example directory:
   ```bash
   cd examples/basic-js  # or js-react, or typescript-react
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. Open your browser:
   - Visit `http://localhost:5173`
   - Check the console for API route information

---

## 📊 Comparison Table

| Feature | basic-js | js-react | typescript-react |
|---------|----------|----------|------------------|
| **Language** | JavaScript | JavaScript | TypeScript |
| **Framework** | None | React | React |
| **Type Safety** | ❌ | ❌ | ✅ |
| **Response Helpers** | ❌ | ❌ | ✅ |
| **Error Classes** | ❌ | ❌ | ✅ |
| **Validation** | ❌ | ❌ | ✅ |
| **Generated Types** | ❌ | ❌ | ✅ |
| **Generated Services** | ✅ (JS) | ✅ (JS) | ✅ (TS) |
| **Middlewares** | ❌ | ❌ | ✅ |
| **HTTP Methods** | GET, POST | GET, POST | All methods |
| **Complexity** | ⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Best For** | Learning | React (JS) | Production |

---

## 🎯 Which Example Should I Use?

### Start with `basic-js` if:
- You're new to Vitek
- You want to understand the fundamentals
- You prefer simplicity
- You don't need a framework

### Use `js-react` if:
- You're building a React app
- You prefer JavaScript over TypeScript
- You want to see React integration
- You need a middle ground between basic and advanced

### Use `typescript-react` if:
- You're building a production app
- You want full type-safety
- You need all Vitek features
- You want the complete reference implementation

---

## 📁 Example Structure

Each example follows a similar structure:

```
example-name/
├── src/
│   ├── api/              # API routes (file-based)
│   │   ├── *.get.js/ts   # GET endpoints
│   │   ├── *.post.js/ts  # POST endpoints
│   │   └── middleware.js/ts  # Middlewares (if applicable)
│   ├── api.services.js/ts  # Generated services
│   ├── api.types.ts      # Generated types (TypeScript only)
│   └── App.jsx/tsx       # Main component (React examples)
├── index.html            # Entry HTML
├── vite.config.js/ts     # Vite configuration
├── package.json          # Dependencies
└── README.md            # Example-specific documentation
```

---

## 🔗 Links

- [Main README](../README.md) - Full Vitek documentation
- [basic-js README](./basic-js/README.md) - Detailed basic-js documentation
- [js-react README](./js-react/README.md) - Detailed js-react documentation
- [typescript-react README](./typescript-react/README.md) - Detailed typescript-react documentation

---

## 💡 Tips

1. **Start Simple**: Begin with `basic-js` to understand the core concepts
2. **Build the Plugin First**: Always build the plugin from the root before running examples
3. **Check the Console**: Vitek logs useful information about registered routes
4. **Explore Generated Files**: Look at `api.services.js/ts` to see how services are generated
5. **Try Modifying Routes**: Add new routes and see them appear automatically

---

## 🐛 Troubleshooting

### Plugin not found
**Solution**: Make sure you've built the plugin from the project root:
```bash
cd ../..
npm run build
```

### Routes not working
**Solution**: 
- Check that your route files follow the naming convention: `[name].[method].ts/js`
- Ensure the file exports a default handler function
- Check the browser console for error messages

### Types not generating (TypeScript projects)
**Solution**:
- Ensure `tsconfig.json` exists in the example directory
- Check that route files have proper TypeScript syntax
- Restart the dev server

---

## 🤝 Contributing

Found an issue with an example? Want to add a new example? Contributions are welcome!

1. Check existing examples for patterns
2. Follow the same structure and conventions
3. Update this README with your new example
4. Submit a pull request

---

<div align="center">
  <p>Happy coding with Vitek! 🚀</p>
</div>
