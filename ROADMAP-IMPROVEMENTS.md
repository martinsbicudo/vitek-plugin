# Roadmap de Melhorias – Vitek Plugin

Documento dividido em fases: testes, problemas potenciais, segurança, organização, bundle, boas práticas e revisão final do projeto (incluindo examples).

---

## Fase 1 – Oportunidades de Testes

### 1.1 Módulos do core sem testes unitários

| Módulo | Linhas | Prioridade | Observação |
|--------|--------|------------|------------|
| `src/core/openapi/generate.ts` | ~704 | Alta | Geração OpenAPI; lógica complexa (paths, schemas, JSDoc). Testes para `generateOpenApiSpec`, edge cases e sanitização. |
| `src/core/types/generate.ts` | ~690 | Alta | Geração de tipos (params, body, query). Testes para extração de tipos e union `VitekRoute`. |
| `src/adapters/vite/dev-server.ts` | ~355 | Alta | Orquestração dev (scan, reload, WebSocket). Testes de integração ou unitários para `DevServerState`, dedupe de routes/sockets. |
| `src/core/socket/socket-handler.ts` | ~178 | Média | Handler de WebSocket. Testes para `createSocketHandler`, mensagens e erros. |
| `src/core/file-system/scan-api-dir.ts` | ~171 | Média | Já cobre bastante em `scan-api-dir.test.ts`; garantir edge cases (pastas vazias, nomes especiais). |
| `src/core/file-system/watch-api-dir.ts` | ~61 | Média | Watch de arquivos; testes para callbacks de add/change/remove. |
| `src/core/asyncapi/generate.ts` | ~106 | Média | Geração AsyncAPI; testes para spec e canais. |
| `src/plugin/vitek-dev.ts` | ~89 | Média | Hook de dev; testes para configuração e middleware. |
| `src/plugin/vitek-build.ts` | ~109 | Média | Build da API; testes para `buildApi: false` e geração de bundle. |
| `src/plugin/vitek-preview.ts` | ~131 | Média | Preview com API; testes para servir `/api` no preview. |
| `src/plugin/vitek-transform.ts` | ~57 | Baixa | Resolve de imports; testes para alias e caminhos virtuais. |
| `src/plugin/vitek-resolve.ts` | ~31 | Baixa | Resolução de módulos da API; testes para `apiDir` e virtual. |
| `src/core/routing/route-types.ts` | ~51 | Baixa | Apenas tipos; coberto indiretamente por outros testes. |
| `src/core/validation/types.ts` | ~29 | Baixa | Apenas tipos. |
| `src/core/types/socket-schema.ts` | ~26 | Baixa | Schema para sockets. |
| `src/core/shared/vitek-app.ts` | ~22 | Baixa | Tipos e helpers de app. |

**Ações sugeridas**

- Criar `src/core/openapi/generate.test.ts`: specs gerados, `apiBasePath`, `info`, rotas sem body/query.
- Criar `src/core/types/generate.test.ts` (expandir ou complementar): foco em geração de tipos a partir de arquivos de rota.
- Criar `src/core/asyncapi/generate.test.ts`: spec AsyncAPI com um ou mais sockets.
- Criar `src/core/socket/socket-handler.test.ts`: criação do handler e mensagens.
- Considerar testes para `vitek-dev`, `vitek-build`, `vitek-preview` (via plugin.test ou testes de integração).

### 1.2 Features atuais e cobertura em examples

| Feature | Documentação / Exemplo | Teste no example |
|---------|------------------------|-------------------|
| OpenAPI + AsyncAPI | api-docs | post-build.test.ts |
| Middlewares hierárquicos | typescript-react | post-build.test.ts |
| Validação (validateBody/validateQuery) | typescript-react | Cobrir em post-build ou teste E2E |
| Response helpers + HttpError | typescript-react | Cobrir em post-build |
| Rate limiting (beforeApiRequest) | rate-limit | post-build.test.js |
| Prisma + SQLite | prisma | post-build.test.ts |
| Docker | docker | post-build.test.ts |
| Imports externos (lib fora de api) | import-external | post-build.test.ts |
| WebSockets | socket-only, typescript-react, etc. | post-build em socket-only e typescript-react |
| CORS | typescript-react (cors.options) | Não há teste específico de CORS no example |
| Proxy (trustProxy, clientIp) | request-handler.test.ts | OK no core |

**Ações sugeridas**

- Em **typescript-react**: adicionar cenários em `post-build.test.ts` (ou E2E) para: validação (422), response helpers, HttpError, CORS preflight.
- Em **api-docs**: post-build que verifique existência de `openapi.json`, `asyncapi.json` e `api-docs.html` e, se possível, estrutura mínima.
- Em **rate-limit**: post-build que verifique resposta 429 após N requests (ou mock do tempo).
- Em **prisma**: post-build que verifique rotas e, se viável, um GET em `/api/users` ou similar.

### 1.3 Novos examples sugeridos

| Example | Objetivo | Testes |
|---------|----------|--------|
| **validation-only** | Apenas validação (validateBody/validateQuery) e ValidationError | post-build: 200 com body válido, 422 com body inválido |
| **error-handling** | Uso de HttpError, onError do plugin, response helpers | post-build: 404, 400, 500 e formato de resposta |
| **cors** | CORS com opções (origin, methods), OPTIONS | post-build ou E2E: preflight e headers CORS |
| **minimal-ts** | TypeScript mínimo (1 rota, sem React) | post-build: dist, api.types.ts, api.services.ts |

### 1.4 Testes E2E

- `scripts/e2e.mjs` existe; garantir que cobre: dev server (GET /api/health), build + vitek-serve (opcional).
- Adicionar, se ainda não houver, um E2E que rode build em um example (ex.: basic-js) e faça uma request real ao bundle (vitek-serve).

---

## Fase 2 – Possíveis Problemas

### 2.1 Robustez e edge cases

- **Body size ilimitado**: `request-handler.ts` acumula body em memória sem limite; body muito grande pode causar OOM. **Sugestão**: limite configurável (ex.: 1MB) e 413 ao exceder.
- **Regex em validação**: `ValidationRule.pattern` aceita `string | RegExp`; regex maliciosos ou complexos podem causar ReDoS. **Sugestão**: documentar risco, evitar regex de usuário em produção ou sanitizar/timeout.
- **Path normalization**: `routePath` vem de `url.pathname`; já restrito a rotas conhecidas (matchRoute). Manter sem usar path para leitura de arquivo; está OK.
- **Watch em diretórios grandes**: `watch-api-dir` pode gerar muitos eventos em projetos grandes; considerar debounce ou throttling se houver queixas.

### 2.2 Integração e configuração

- **vite.config sem build.outDir**: `vitek-build` usa `config.build?.outDir ?? 'dist'`; se Vite mudar default, alinhar.
- **Plugin em monorepo**: `apiDir` e `root` devem apontar para o projeto correto; exemplos com workspace podem precisar de doc ou example.
- **Ordem de plugins**: comportamento com outros plugins que alteram resolve/transform; documentar “usar vitek após outros plugins que mexem em src”.

### 2.3 Tipos e geração

- **Falha na geração de tipos**: se `runFileGeneration` falhar (ex.: sintaxe em rota), tipos antigos podem permanecer; `onGenerationError` existe mas não há fallback de tipos. **Sugestão**: documentar e, se desejado, escrever tipos mínimos em caso de erro.
- **api.types.ts em JS**: projetos só JS não geram `api.types.ts`; já esperado; documentação está clara.

### 2.4 Produção

- **vitek-serve e porta**: `--port` e `--host` documentados; garantir que README e docs de produção estejam alinhados.
- **Build sem API**: `buildApi: false` deve pular bundle da API; testar em example dedicado.

---

## Fase 3 – Segurança

### 3.1 Já tratado ou de baixo risco

- **Path traversal**: Rotas são resolvidas por match em lista conhecida; não há leitura de arquivo por path do request. OK.
- **CORS**: Suporte configurável; exemplo typescript-react com `cors.options.ts`. Manter documentação para origens restritas em produção.
- **Trust proxy**: `trustProxy` e `X-Forwarded-*` documentados; uso correto é responsabilidade de quem implanta.

### 3.2 Melhorias recomendadas

| Item | Ação |
|------|------|
| **Limite de body** | Adicionar opção (ex.: `maxBodySize`) no handler e no plugin; rejeitar com 413 e não acumular em memória além do limite. |
| **Headers de resposta** | Garantir que valores de `response.headers` não contenham CRLF (evitar response splitting); sanitizar ou validar antes de `res.setHeader`. |
| **Validação com pattern** | Documentar que `ValidationRule.pattern` (string) é compilada com `new RegExp`; evitar padrões complexos de origem não confiável (ReDoS). Considerar timeout em validação ou lista de padrões permitidos. |
| **Dependências** | Manter `connect`, `serve-static`, `ws`, `magic-string`, `esbuild` atualizados; rodar `pnpm audit` e corrigir vulnerabilidades. |
| **Logs** | Evitar logar body ou headers completos em produção; documentar boas práticas no logger. |

### 3.3 Documentação de segurança

- Adicionar seção “Security” no README ou em `docs/`: body limit, CORS, trust proxy, validação, headers, dependências.

---

## Fase 4 – Organização dos Arquivos

### 4.1 Arquivos muito grandes

| Arquivo | Linhas | Sugestão |
|---------|--------|----------|
| `src/core/openapi/generate.ts` | ~704 | Dividir em: `openapi/spec-builder.ts` (paths/schemas), `openapi/jsdoc.ts` (metadados), `openapi/generate.ts` (orquestração e export). |
| `src/core/types/generate.ts` | ~690 | Dividir em: `types/generate-params.ts`, `types/generate-body-query.ts`, `types/generate-route-union.ts`, `types/generate.ts` (orquestração). |
| `src/adapters/vite/dev-server.ts` | ~355 | Extrair: `dev-server-state.ts` (classe e reload) e `dev-server-middleware.ts` (registro de middleware/WS); `dev-server.ts` só importa e conecta. |

### 4.2 Organização por contexto

- **Plugin**: já em `src/plugin/`; manter. Opcional: agrupar hooks em subpasta `src/plugin/hooks/` (vitek-dev, vitek-build, vitek-preview, vitek-transform, vitek-resolve) se crescer.
- **Core**: já separado por domínio (routing, file-system, validation, etc.). Manter.
- **Testes**: `src/plugin.test.ts` na raiz de `src/`; opcional mover para `src/plugin/plugin.test.ts` ou `tests/plugin.test.ts` para deixar `src/` só com código de biblioteca.

### 4.3 Pastas e nomes

- **openapi e asyncapi**: já em `core/openapi` e `core/asyncapi`; OK.
- **shared**: `src/shared/` com errors e response-helpers; OK. Constantes em `shared/constants.ts`; OK.
- **CLI**: `src/cli/` com init, serve, cli; fixtures em `src/cli/fixtures/serve-config`; OK.

---

## Fase 5 – Tamanho do Bundle

### 5.1 Plugin (consumidor Vite)

- O plugin é consumido como fonte TypeScript/JS pelo Vite; o “bundle” do plugin é o output do `tsc` (`dist/`). Não há Rollup/terser no build do plugin.
- **Oportunidades**:
  - **Tree-shake**: exports nomeados em `index.ts` permitem que o consumidor importe só o que usa; manter API estável e evitar barrel gigante.
  - **Dependências**: `connect`, `serve-static`, `ws`, `magic-string`, `esbuild` são de runtime ou build; não dá para remover sem perder função. Manter como peer onde fizer sentido (ex.: vite já é peer).
  - **Separar entrypoints** (avançado): ex. `vitek-plugin/core` só com tipos e helpers sem dev-server, para quem só quer tipos; exige mudança de exports.

### 5.2 Bundles gerados pelo plugin (vitek-api.mjs, vitek-sockets.mjs)

- Gerados por esbuild a partir dos handlers do usuário; tamanho depende do código do usuário.
- **Oportunidades**:
  - Minificação já via esbuild (minify no build do Vite).
  - Documentar que imports pesados (ex.: prisma client) aumentam o bundle; sugerir lazy load ou rotas que importem só o necessário.

### 5.3 CLI (dist/cli/)

- `cli.js`, `serve.js`, `init.js` são usados em produção (vitek, vitek-serve). Manter apenas o necessário nos entrypoints; init e serve sem carregar todo o plugin de Vite reduziria peso se fosse problema (hoje parece aceitável).

---

## Fase 6 – Boas Práticas

### 6.1 Código

- **Comentários**: conforme regras do projeto, evitar comentários no código; preferir nomes claros e funções pequenas.
- **Tipos**: manter strict TypeScript; evitar `any` onde for possível (ex.: `validator.ts` tem `value: any` em validateField; tipar com `unknown` e type guards).
- **Erros**: usar classes de erro do `shared/errors`; evitar throw de strings.
- **Async**: garantir que handlers assíncronos e middlewares sejam tratados (await, catch) em request-handler e socket-handler.

### 6.2 Testes

- Padrão: testes ao lado do código (`*.test.ts`); manter.
- Naming: descritivo (ex.: “returns 422 when body is invalid”).
- Fixtures: usar `src/cli/fixtures` e temp dirs para testes que precisam de arquivos; evitar paths fixos.

### 6.3 Documentação

- Manter README e docs (VitePress) alinhados com options (apiDir, buildApi, openApi, cors, trustProxy, etc.).
- Exemplos de código nos docs devem ser testáveis (copiar/colar) e refletir a API atual.
- Changelog ou “Breaking changes” em releases maiores.

### 6.4 Git e CI

- `.github/workflows`: pr_build_check e pr_tests_check; manter e garantir que `pnpm test` e `pnpm run build` rodem em PRs.
- Opcional: job que rode `examples:build-and-test` em CI para evitar regressões nos examples.

### 6.5 Acessibilidade e DX

- Mensagens de erro do plugin (ex.: “No vite.config found”, “Route not found”) claras e, se possível, com link para a doc.
- Tipos exportados para VitekContext, VitekResponse, RouteHandler, etc., facilitam autocomplete; manter exports em `index.ts`.

---

## Fase 7 – Revisão Final do Projeto

### 7.1 Alinhamento com proposta e documentação

- **Proposta**: File-based HTTP API + WebSockets, tipos gerados, OpenAPI/AsyncAPI, middlewares, validação, produção com vitek-serve. Documentado em README, docs/ e architecture.md. **Status**: alinhado.
- **Examples**: basic-js, js-react, typescript-react, import-external, socket-only, api-docs, prisma, docker, rate-limit cobrem os casos principais. **Gaps**: validação e CORS só em typescript-react; considerar examples dedicados (Fase 1.3).

### 7.2 Checklist de integração

- [ ] Build: `pnpm run build` gera `dist/` sem erros.
- [ ] Testes: `pnpm test` passa (todos os 30 arquivos de teste).
- [ ] Exports: `index.ts` exporta plugin, tipos, helpers, erros, validação, manifest; nenhum export quebrado.
- [ ] CLI: `vitek init` e `vitek-serve` funcionam após build; bins no package.json apontam para dist.
- [ ] Examples: cada example tem `package.json` com scripts dev/build/start/test; scripts na raiz `examples:build`, `examples:test`, `examples:build-and-test` incluem todos (incl. rate-limit).
- [ ] Docs: VitePress build e links internos OK; guias refletem a API atual.

### 7.3 Testes faltando (resumo)

- **Core**: openapi/generate, types/generate (complementar), asyncapi/generate, socket-handler, watch-api-dir; opcional: vitek-dev, vitek-build, vitek-preview.
- **Examples**: typescript-react (validação, CORS, errors); api-docs (estrutura dos docs); rate-limit (429); prisma (opcional request). Novos examples: validation-only, error-handling, cors, minimal-ts (Fase 1.3).

### 7.4 Exemplos – consistência

- Todos os examples com script `test` têm `post-build.test.ts` ou `post-build.test.js` que rodam após build.
- `examples/build-all.sh` e `examples/run-all-tests.sh` incluem `rate-limit` (já ajustado).
- README em cada example descreve objetivo e como rodar; examples/README.md e docs/examples.md com tabela comparativa atualizada.

### 7.5 Próximos passos sugeridos (ordem sugerida)

1. Fase 3: limite de body e documentação de segurança.
2. Fase 1: testes para openapi/generate, asyncapi/generate, socket-handler; depois tipos generate.
3. Fase 1: reforçar post-build em typescript-react e api-docs; considerar E2E em script.
4. Fase 4: quebrar openapi/generate e types/generate em arquivos menores.
5. Fase 1.3: adicionar example validation-only ou error-handling.
6. Fase 6: reduzir `any` em validator e revisar mensagens de erro do plugin.

---

## Resumo das Fases

| Fase | Conteúdo |
|------|----------|
| 1 | Testes: módulos sem teste, features em examples, novos examples, E2E |
| 2 | Problemas: body size, ReDoS, watch, config, tipos, produção |
| 3 | Segurança: body limit, headers, validação, deps, doc |
| 4 | Organização: arquivos grandes, pastas, localização de testes |
| 5 | Bundle: tree-shake, deps, entrypoints, bundles gerados |
| 6 | Boas práticas: código, testes, docs, CI, DX |
| 7 | Revisão: proposta, integração, checklist, próximos passos |

Este documento pode ser usado como backlog e atualizado conforme itens forem implementados.
