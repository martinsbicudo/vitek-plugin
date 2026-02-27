# Planejamento MCP para Vitek

Este documento descreve o planejamento completo para oferecer suporte a **Model Context Protocol (MCP)** em duas frentes: um MCP do produto Vitek (para AIs usarem o framework) e um MCP ativável por projeto (para AIs integrarem com a API criada com Vitek).

---

## 1. Visão geral

| Frente | Objetivo | Público | Quando usar |
|--------|----------|---------|-------------|
| **MCP do Vitek** | Ajudar AIs a *construir e modificar* backends com Vitek | Qualquer usuário de Vitek que usa Cursor, Claude Desktop, etc. | Ao pedir à AI para criar rotas, middlewares, sockets, validação, etc. |
| **MCP da API (projeto)** | Ajudar AIs a *integrar com* a API do projeto (rotas, tipos, chamadas) | Desenvolvedor de front ou de outro serviço que consome a API Vitek | Ao pedir à AI para chamar endpoints, tipar requests, ou documentar integração |

Ambas as frentes são complementares e podem ser implementadas em paralelo ou em sequência.

---

## 2. MCP do Vitek (produto)

### 2.1 Objetivo e valor

- Expor conhecimento e capacidades do Vitek via MCP para que assistentes (Cursor, Claude Desktop, outros clientes MCP) possam:
  - Sugerir código alinhado às convenções do Vitek (nomenclatura de arquivos, `VitekContext`, helpers de resposta, validação).
  - Criar rotas `[name].[method].ts`, middlewares, sockets `.socket.ts`, e configuração do plugin.
  - Consultar documentação e exemplos sem depender apenas do modelo treinado.

### 2.2 Escopo funcional

#### 2.2.1 Resources (leitura)

| Resource URI | Descrição | Conteúdo sugerido |
|--------------|-----------|-------------------|
| `vitek://docs/routing` | Convenções de roteamento | Nomenclatura `[param].get.ts`, `[...rest].get.ts`, padrões, `apiDir`, `apiBasePath` |
| `vitek://docs/middlewares` | Middlewares | Estrutura de `middleware.ts`, `basePattern`, ordem de aplicação, `next()` |
| `vitek://docs/websockets` | WebSockets | Arquivos `.socket.ts`, `VitekSocketContext`, `sockets` no context, base path |
| `vitek://docs/context` | Context e request | `VitekContext`, `VitekRequest`, `path`, `params`, `query`, `body`, `headers`, `clientIp` |
| `vitek://docs/response` | Respostas | `VitekResponse`, helpers `ok`, `created`, `notFound`, `json`, `redirect`, etc. |
| `vitek://docs/validation` | Validação | `validate`, `validateBody`, `validateQuery`, `ValidationSchema`, `enableValidation` |
| `vitek://docs/errors` | Erros HTTP | `HttpError`, `BadRequestError`, `ValidationError`, etc., e `onError` |
| `vitek://docs/plugin-api` | Plugin API | `VitekPlugin`, `afterTypesGenerated`, `beforeApiRequest`, tipos de contexto |
| `vitek://docs/configuration` | Configuração | `VitekOptions`: `apiDir`, `openApi`, `cors`, `sockets`, `alias`, `maxBodySize`, etc. |
| `vitek://docs/introspection` | Introspection | `getManifest`, `getRoutes`, `getSockets`, `writeManifest`, formato do manifest |

Cada resource pode ser gerado a partir do conteúdo atual da documentação (docs/) e dos tipos exportados em `src/index.ts`, garantindo consistência com a versão do pacote.

#### 2.2.2 Tools (ações)

| Tool | Descrição | Inputs | Comportamento |
|------|-----------|--------|---------------|
| `vitek_create_route` | Criar esqueleto de rota | `path` (ex: `users/[id]`), `method` (get, post, put, patch, delete, options), `apiDir` opcional | Retorna snippet de código e caminho do arquivo sugerido (ex: `src/api/users/[id].get.ts`) |
| `vitek_create_middleware` | Criar esqueleto de middleware | `basePattern` (ex: `users` ou vazio para global), `apiDir` opcional | Retorna snippet e caminho do arquivo |
| `vitek_create_socket` | Criar esqueleto de socket | `pattern` (ex: `chat`), `apiDir` opcional | Retorna snippet e caminho do arquivo |
| `vitek_suggest_vite_config` | Sugerir configuração Vite + Vitek | `options` opcionais (openApi, cors, apiDir, etc.) | Retorna trecho para `vite.config.ts` |
| `vitek_validate_convention` | Validar se um caminho de arquivo segue convenção | `filePath` (ex: `src/api/users/[id].get.ts`) | Retorna se é rota, middleware ou socket válido e qual método/padrão |

Ferramentas adicionais opcionais em fases posteriores: `vitek_add_validation_to_route`, `vitek_generate_openapi_snippet`.

### 2.3 Arquitetura técnica

- **Runtime:** Node.js (LTS), sem dependência de Vite no processo do MCP.
- **Protocolo:** MCP (Model Context Protocol) sobre stdio ou SSE, conforme SDK escolhido.
- **Implementação:** Servidor MCP em pacote separado (ex.: `vitek-mcp` ou `@vitek/mcp`) que:
  - Usa o SDK oficial MCP (ex.: `@modelcontextprotocol/sdk` em TypeScript/Node).
  - Implementa handlers para os resources e tools listados.
  - Lê documentação e metadados a partir do pacote `vitek-plugin` instalado (ou bundle embutido) para manter compatibilidade por versão.

- **Pacote NPM:** Publicar `vitek-mcp` (ou nome a definir) com `bin` para execução via `npx vitek-mcp` ou configurável em clientes MCP (Cursor, Claude) como comando do servidor.

### 2.4 Dependências e entregáveis

- Dependência: SDK MCP para Node (ex.: `@modelcontextprotocol/sdk`).
- Entregáveis:
  - Repositório ou subpasta `packages/vitek-mcp` com servidor MCP.
  - Lista de resources e tools estável e documentada.
  - Documentação de instalação (Cursor, Claude Desktop, etc.) e versionamento alinhado ao `vitek-plugin`.

### 2.5 Critérios de aceitação (MCP do Vitek)

- [x] Servidor MCP inicia e expõe os resources e tools definidos.
- [x] Cliente MCP (ex.: Cursor) consegue ler pelo menos um resource e invocar uma tool.
- [x] Conteúdo dos resources está alinhado à documentação e à API pública do Vitek da versão correspondente.
- [x] README com instruções de configuração para pelo menos um cliente (ex.: Cursor).

**Implementação (Fase 1 + 2):** O servidor MCP do Vitek está em `packages/vitek-mcp`. Inclui os 10 resources (routing, context, response, middlewares, websockets, validation, errors, plugin-api, configuration, introspection) e as 5 tools (`vitek_create_route`, `vitek_create_middleware`, `vitek_create_socket`, `vitek_suggest_vite_config`, `vitek_validate_convention`). Ver `packages/vitek-mcp/README.md` para instalação (Cursor, Claude Desktop) e uso.

---

## 3. MCP da API do projeto (por projeto)

### 3.1 Objetivo e valor

- No contexto de um projeto que já usa Vitek, expor a *API desse projeto* (rotas, métodos, parâmetros, e quando possível tipos/schemas) para a AI que está ajudando no mesmo repositório (ex.: front-end ou outro serviço).
- Reduz erros de integração (paths errados, métodos errados, bodies malformados) e evita que o desenvolvedor precise colar OpenAPI ou tipos manualmente no contexto.

### 3.2 Escopo funcional

#### 3.2.1 Fonte de dados

- **Manifest:** `getManifest(root, apiDir)` já expõe `routes`, `middlewares`, `sockets` com `method`, `pattern`, `params`, `file`.
- **OpenAPI:** Se o projeto tiver `openApi: true`, a spec já é gerada; pode ser lida de arquivo ou gerada sob demanda.
- **Tipos gerados:** `api.types.ts` / `api.services.ts` (ou nomes configuráveis) gerados pelo Vitek; podem ser lidos para enriquecer recursos com tipos de body/query quando disponíveis.

#### 3.2.2 Resources (leitura)

| Resource URI | Descrição | Fonte |
|--------------|-----------|--------|
| `vitek-api://manifest` | Manifest completo (routes, middlewares, sockets) | `getManifest(root, apiDir)` |
| `vitek-api://routes` | Lista de rotas com method, pattern, params, file | `manifest.routes` |
| `vitek-api://sockets` | Lista de sockets com pattern, params, file | `manifest.sockets` |
| `vitek-api://openapi` | Spec OpenAPI 3.0 (se disponível) | Arquivo gerado ou `generateOpenApiSpec` com dados atuais |
| `vitek-api://asyncapi` | Spec AsyncAPI (se houver sockets) | Arquivo gerado ou equivalente |

O servidor MCP do projeto deve resolver `root` e `apiDir` a partir do diretório de trabalho ou de um arquivo de configuração (ex.: `vitek.mcp.json` ou opção no `vite.config` / `vitek.config.mjs`).

#### 3.2.3 Tools (ações) – opcional

| Tool | Descrição | Inputs | Comportamento |
|------|-----------|--------|---------------|
| `vitek_api_call` | Chamar um endpoint da API local | `method`, `path` (relativo ao apiBasePath), `body` opcional, `headers` opcional | Faz requisição HTTP para base URL configurável (ex.: `http://localhost:5173`) e retorna status e body. Útil para a AI testar ou demonstrar chamadas. |

Risco: a API precisa estar rodando (dev ou serve). Documentar que a tool só funciona com servidor ativo; caso contrário, retornar erro claro.

### 3.3 Ativação e modo de execução

- **Onde vive:** No projeto do usuário, não no pacote principal. Duas opções:
  - **A)** Comando no CLI do Vitek: `vitek mcp` (ou `vitek-mcp-dev`) que inicia um servidor MCP (stdio ou SSE) com contexto do projeto (root, apiDir, openApi, etc.).
  - **B)** Pacote separado `vitek-mcp-dev` instalável no projeto, com script `"mcp": "vitek-mcp-dev"` e o usuário configura o cliente MCP para rodar esse comando no cwd do projeto.

- **Configuração do projeto:**
  - Ler `apiDir` (e opcionalmente `apiBasePath`, `openApi`) do `vite.config` ou de `vitek.config.mjs` / `vitek.mcp.json` para não duplicar configuração.
  - Se não houver Vite config no cwd, usar defaults (ex.: `src/api`) e documentar.

### 3.4 Arquitetura técnica

- **Runtime:** Node.js.
- **Protocolo:** MCP sobre stdio (recomendado para dev local) ou SSE.
- **Implementação:**
  - Servidor MCP que importa `getManifest`, `getRoutes`, `getSockets` (e se possível `generateOpenApiSpec` ou lê arquivo) do `vitek-plugin`.
  - Resources leem do disco e/ou chamam as funções de introspection; OpenAPI pode ser gerado em memória ou lido de build anterior (com aviso se desatualizado).
- **Segurança:** Servidor destinado a ambiente de desenvolvimento; não expor em rede pública. Opção de binding apenas em localhost se usar SSE.

### 3.5 Critérios de aceitação (MCP da API)

- [x] Comando ou script inicia o servidor MCP no diretório do projeto e expõe `vitek-api://manifest` (e pelo menos `routes` / `sockets`).
- [x] Cliente MCP consegue ler o manifest e listar rotas/sockets do projeto.
- [x] Se o projeto tiver OpenAPI habilitado, resource `vitek-api://openapi` retorna spec válida (ou indica como gerar).
- [x] Documentação explica como configurar o cliente (ex.: Cursor) para usar esse MCP no repositório do projeto.
- [x] (Opcional) Tool `vitek_api_call` funciona quando a API está rodando e base URL está configurada.

**Implementação (Fase 3):** Comando `vitek mcp` no CLI do vitek-plugin inicia o servidor MCP no cwd. Config opcional em `vitek.mcp.json` (apiDir, apiBasePath, socketBasePath, baseUrl). Resources: `vitek-api://manifest`, `routes`, `sockets`, `openapi`, `asyncapi`. Tool `vitek_api_call` para chamar a API local. Documentação em [docs/guide/mcp-project.md](docs/guide/mcp-project.md).

---

## 4. Cronograma sugerido (fases)

### Fase 1 – Fundação (MCP do Vitek)

1. Criar pacote/repo do servidor MCP do Vitek.
2. Integrar SDK MCP; expor 2–3 resources de documentação e 1 tool (ex.: `vitek_create_route`).
3. Documentar instalação em um cliente (Cursor).
4. Validar com usuários internos ou beta.

### Fase 2 – MCP do Vitek completo

1. Completar todos os resources e tools planejados.
2. Alinhar conteúdo aos docs e à API do Vitek; automatizar geração de conteúdo a partir de docs/tipos quando possível.
3. Publicar pacote NPM e anunciar.

### Fase 3 – MCP da API do projeto

1. Definir comando (`vitek mcp`) ou pacote (`vitek-mcp-dev`) e contrato de configuração (vite.config / vitek.config.mjs / vitek.mcp.json).
2. Implementar servidor MCP que usa `getManifest`, `getRoutes`, `getSockets` e OpenAPI quando existir.
3. Expor resources `manifest`, `routes`, `sockets`, `openapi`.
4. Documentar configuração no projeto e no cliente MCP.
5. (Opcional) Implementar tool `vitek_api_call` e documentar requisitos (servidor ativo, base URL).

### Fase 4 – Refinamentos

1. ~~Suporte a AsyncAPI no MCP da API (resource `vitek-api://asyncapi`).~~ (já incluído na Fase 3)
2. Melhorias de UX: mensagens claras quando OpenAPI não está disponível ou está desatualizado. (opcional; OpenAPI/AsyncAPI são geradas sob demanda)
3. ~~Testes automatizados para ambos os servidores MCP (resources e tools).~~ Testes unitários adicionados: `packages/vitek-mcp/src/tools/*.test.ts` (create-route, create-middleware, create-socket, suggest-vite-config, validate-convention) e `src/cli/mcp-project-config.test.ts`.

---

## 5. Riscos e dependências

- **MCP em evolução:** Protocolo e SDK podem mudar; manter dependência em versão estável e acompanhar changelog.
- **Manutenção de conteúdo:** Resources do MCP do Vitek devem acompanhar mudanças na documentação e na API; considerar geração a partir de docs e tipos para reduzir drift.
- **Descoberta:** README do vitek-plugin e docs mencionam o MCP; `vitek init` exibe uma dica ao final: "Tip: expose your API to AI assistants with `vitek mcp`".

---

## 6. Métricas de sucesso

- Número de instalações ou referências ao pacote MCP do Vitek.
- Redução de issues/PRs com código que não segue convenções do Vitek (rotas mal nomeadas, uso incorreto de context).
- Feedback qualitativo: desenvolvedores conseguem pedir à AI para criar rotas/sockets e obter código utilizável; integração com a API do projeto fica mais rápida com o MCP da API.

---

## 7. Referências

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [MCP SDK (TypeScript/Node)](https://github.com/modelcontextprotocol/typescript-sdk)
- Documentação Vitek: [docs/](../), [Introspection](../guide/introspection.md), [Plugin API](../guide/plugin-api.md), [OpenAPI](../guide/openapi.md)
- Código: `getManifest`, `getRoutes`, `getSockets` em `src/core/introspection/manifest.ts`; `VitekManifest` e tipos em `src/index.ts`
