# MCP – API do projeto

No contexto de um projeto que usa Vitek, você pode expor a **API desse projeto** (rotas, sockets, manifest, OpenAPI, AsyncAPI) para assistentes de IA via **Model Context Protocol (MCP)**. Assim, a IA que está ajudando no front-end ou em outro serviço consegue ver os endpoints e tipos sem precisar colar documentação manualmente.

## Comando

No diretório do seu projeto (onde está o `vite.config` e a pasta `src/api`), execute:

```bash
vitek mcp
```

Isso inicia um servidor MCP em **stdio**. O servidor usa o diretório atual como raiz do projeto e lê a configuração opcional em `vitek.mcp.json`.

## Configuração (opcional)

Crie `vitek.mcp.json` na raiz do projeto para ajustar paths e URL base:

```json
{
  "apiDir": "src/api",
  "apiBasePath": "/api",
  "socketBasePath": "/api/ws",
  "baseUrl": "http://localhost:5173"
}
```

| Campo | Padrão | Descrição |
|-------|--------|-----------|
| `apiDir` | `src/api` | Pasta das rotas e sockets |
| `apiBasePath` | `/api` | Prefixo da API HTTP |
| `socketBasePath` | `/api/ws` | Prefixo dos WebSockets |
| `baseUrl` | `http://localhost:5173` | URL base usada pela tool `vitek_api_call` |

Se o arquivo não existir, esses valores padrão são usados.

## Resources (leitura)

O servidor expõe os seguintes resources:

| URI | Conteúdo |
|-----|----------|
| `vitek-api://manifest` | Manifest completo (routes, middlewares, sockets) |
| `vitek-api://routes` | Lista de rotas HTTP (method, pattern, params, file) |
| `vitek-api://sockets` | Lista de sockets (pattern, params, file) |
| `vitek-api://openapi` | Spec OpenAPI 3.0 gerada a partir das rotas |
| `vitek-api://asyncapi` | Spec AsyncAPI 2.x gerada a partir dos sockets |

A IA pode ler esses resources para conhecer a superfície da sua API.

## Tool (opcional)

- **vitek_api_call** – Chama um endpoint da API local. Parâmetros: `method`, `path` (relativo ao apiBasePath), `body` (opcional), `headers` (opcional).  
  **Requisito:** a API precisa estar rodando (por exemplo `pnpm dev` ou `pnpm start`). A URL base é a definida em `baseUrl` no config (ou `http://localhost:5173`).

## Cursor

1. Em um projeto que usa Vitek, crie ou edite `.cursor/mcp.json` (ou Configurações → MCP).
2. Adicione o servidor apontando para o comando `vitek mcp` no diretório do projeto:

```json
{
  "mcpServers": {
    "vitek-api": {
      "command": "pnpm",
      "args": ["exec", "vitek", "mcp"]
    }
  }
}
```

Se você usa `npx` em vez de `pnpm`:

```json
{
  "mcpServers": {
    "vitek-api": {
      "command": "npx",
      "args": ["-y", "vitek-plugin", "mcp"]
    }
  }
}
```

3. Reinicie o Cursor ou recarregue o MCP. A IA passará a poder ler os resources `vitek-api://*` e, se a API estiver rodando, usar a tool `vitek_api_call`.

## Claude Desktop

No arquivo de configuração do Claude (por exemplo `~/Library/Application Support/Claude/claude_desktop_config.json` no macOS), adicione:

```json
{
  "mcpServers": {
    "vitek-api": {
      "command": "pnpm",
      "args": ["exec", "vitek", "mcp"]
    }
  }
}
```

Abra o Claude Desktop a partir do diretório do seu projeto Vitek (ou configure o `cwd` conforme a documentação do Claude).

## Resumo

- **Comando:** `vitek mcp` (no diretório do projeto).
- **Config:** `vitek.mcp.json` (opcional).
- **Resources:** manifest, routes, sockets, openapi, asyncapi.
- **Tool:** `vitek_api_call` (requer API rodando).
- **Uso:** configurar o cliente MCP (Cursor, Claude Desktop) para executar `vitek mcp` no cwd do projeto.
