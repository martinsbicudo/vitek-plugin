# Vitek Plugin

**File-based HTTP API generation for Vite**

<div class="vp-badges">

[![Version](https://img.shields.io/badge/version-0.2.1--beta-orange.svg)](https://github.com/martinsbicudo/vitek-plugin)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/martinsbicudo/vitek-plugin/blob/main/LICENSE)
[![Vite](https://img.shields.io/badge/vite-^5.0.0%20%7C%7C%20^6.0.0-646CFF.svg)](https://vitejs.dev/)

</div>

![Vitek Plugin Logo](/logo.webp)

> **Beta Version**: This project is currently in beta/testing phase. APIs may change in future releases.

---

## About the Name "Vitek"

**Vitek** is a portmanteau combining **"Vite"** (the build tool) and **"tek"** (a suffix suggesting technology/toolkit). The name reflects the plugin's core purpose: bringing powerful API generation capabilities to the Vite ecosystem.

The "tek" suffix is commonly used in technology naming to denote tools and frameworks (similar to "kit" or "toolkit"), making "Vitek" a natural fit for a plugin that extends Vite's functionality with file-based API routing and type generation.

---

## Overview

**Vitek** is a powerful Vite plugin that enables automatic file-based HTTP API generation. Write your API endpoints as simple TypeScript/JavaScript files, and Vitek handles all the configuration, type generation, and integration with the Vite development server. Run `npx vitek init` to scaffold a new project (creates `src/api` and adds the plugin to your Vite config). For production, **vitek-serve** serves static assets and the API from the same process after `vite build`.

### Why Vitek?

- **Zero Configuration**: Works out of the box with Vite - no separate server setup needed
- **File-Based Routing**: Organize your API like your file system - intuitive and scalable
- **Hot Reload**: Automatic reloading of routes and middlewares on file changes
- **Type-Safe**: Full TypeScript support with auto-generated types and client helpers
- **Developer Experience**: Generated client helpers for seamless frontend integration
- **Auto Documentation**: OpenAPI/Swagger and AsyncAPI (WebSockets) docs generated from your code
- **Modular Architecture**: Core logic is runtime-agnostic, ready for other environments
- **Lightweight**: Minimal overhead, runs directly in Vite's dev server
- **Unified Development**: Same server for frontend and backend during development
- **No Dependencies**: Works with your existing Vite setup without additional runtime dependencies

---

## Features

- **File-based routing**: Automatic routes based on file structure
- **Zero config**: Works automatically with the Vite server
- **Hot reload**: Automatically reloads routes and middlewares on save
- **Type-safe**: Automatically generates TypeScript types for all routes
- **Client helpers**: Generates typed functions to call the API from the frontend
- **Hierarchical middleware**: Middlewares per folder/subfolder
- **All HTTP methods**: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- **Dynamic parameters**: Support for `[id]` and `[...ids]` (catch-all)
- **Typed query params**: Define types for query parameters
- **Typed body**: Define types for request body
- **JavaScript support**: Works with both TypeScript and JavaScript projects
- **Isolated core**: Modular architecture, ready for other runtimes
- **Response control**: Custom status codes and headers via response helpers
- **HTTP error classes**: Built-in error classes with automatic status code mapping
- **Request validation**: Optional runtime validation for body and query parameters
- **Enhanced logging**: Configurable log levels and request/response logging
- **OpenAPI/Swagger + AsyncAPI docs**: Auto-generates REST and WebSocket documentation with interactive UI (Swagger + AsyncAPI tabs)

---

## Quick links

- [Getting Started](/guide/getting-started) - Set up your first route in minutes
- [WebSockets](/guide/websockets) - File-based WebSocket routes, socket ↔ API integration
- [OpenAPI / Swagger + AsyncAPI](/guide/openapi) - Auto-generate API docs (REST + WebSockets)
- [Plugin API](/guide/plugin-api) - Extend with `afterTypesGenerated`, `beforeApiRequest` hooks
- [Alias](/guide/alias) - Use `resolve.alias` for stable import paths
- [Introspection](/guide/introspection) - Programmatic API: `getRoutes`, `getSockets`, `vitek-manifest.json`
- [API Reference](/api/) - Plugin options and exports
- [Examples](/examples) - socket-only, basic-js, js-react, typescript-react, import-external, api-docs, prisma, docker
- [GitHub](https://github.com/martinsbicudo/vitek-plugin)
- [NPM](https://www.npmjs.com/package/vitek-plugin)

---

## Beta Status

This project is currently in beta/testing phase.

- Version: `0.1.2-beta`
- APIs may change in future releases
- Some features may be experimental
- Feedback and bug reports are welcome
