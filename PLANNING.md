# Plano de melhorias — vitek-plugin

Documento de planejamento de melhorias incrementais. Cada fase é entregável de forma independente: ao final da fase, o projeto continua funcionando, com testes atualizados ou novos (incluindo exemplos) e refatorações quando necessário.

---

## Princípios por fase

- **Incremental:** cada fase adiciona valor sem quebrar o existente.
- **Testes:** toda fase inclui ou ajusta testes (unitários e, quando fizer sentido, post-build nos examples).
- **Examples:** se a feature exigir, adicionar ou adaptar um example e garantir `post-build.test.*` + script `test`.
- **Refatorar se precisar:** testes atuais podem ser refatorados para acomodar novas opções ou comportamentos.
- **Docs:** opções e comportamentos novos documentados na mesma fase.

---

## Fase 1 — CORS e proxy (fundação para APIs reais)

**Objetivo:** APIs chamadas do browser e atrás de proxy funcionarem sem workarounds manuais.

### 1.1 CORS

**Contexto:** Não há suporte a CORS; o usuário precisa montar manualmente.

**Ação:**

- Adicionar opção `cors?: boolean | CorsOptions` em `VitekOptions`.
- `CorsOptions`: `origin`, `methods`, `allowedHeaders`, `exposeHeaders`, `credentials`, `maxAge` (tipos e defaults documentados).
- No request-handler (dev, preview, serve): se `cors` estiver definido, responder a OPTIONS com os headers CORS e, em todas as respostas da API, injetar os headers CORS configurados.
- Default quando `cors: true`: `origin: '*'`, `methods: ['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS']`, etc. (documentar).

**Testes:**

- Novo `request-handler.test.ts`: cenários com `cors: true` e `cors: { origin: 'https://example.com' }` (OPTIONS + GET/POST com headers esperados).
- `plugin.test.ts`: garantir que a opção é passada ao handler (mock do createRequestHandler ou integração mínima).
- Nenhum example obrigatório; opcional: mencionar CORS em `api-docs` ou `basic-js` no README do example.

**Docs:** `configuration.md` (tabela + exemplo), `production-deploy.md` ou `production-server.md` (quando usar CORS).

**Critério de conclusão:** CORS configurável; testes passando; docs atualizados.

---

### 1.2 Headers de proxy (X-Forwarded-*)

**Contexto:** Atrás de nginx/Caddy, a URL e o IP real não são refletidos no contexto.

**Ação:**

- No request-handler (ao montar o request para `createContext`): se existirem `X-Forwarded-Proto`, `X-Forwarded-Host`, `X-Forwarded-For`, derivar a URL base e o client IP.
- Adicionar em `VitekContext` (opcional): `clientIp?: string` (valor de `X-Forwarded-For` ou `socket.remoteAddress`).
- Opção `trustProxy?: boolean` (default `false`): só aplicar a lógica de forwarded quando `true`, para não confiar em headers em ambiente não proxy.

**Testes:**

- `request-handler.test.ts`: request com `X-Forwarded-Proto: https`, `X-Forwarded-Host: api.example.com`, `X-Forwarded-For: 1.2.3.4`; com `trustProxy: true`, contexto deve ter `url` e `clientIp` coerentes.
- `create-context.test.ts`: se o contexto passar a receber request “enriquecido”, ajustar ou adicionar testes.

**Docs:** `configuration.md` (opção `trustProxy`), `production-deploy.md` (recomendar `trustProxy: true` atrás de proxy).

**Critério de conclusão:** URL e clientIp corretos atrás de proxy quando `trustProxy: true`; testes e docs ok.

---

### 1.3 Fase 1 — checklist final

- [ ] CORS implementado e testado.
- [ ] Proxy/forwarded implementado e testado.
- [ ] Refatorar testes existentes se necessário (ex.: request-handler receber opções extras).
- [ ] Todos os examples continuam com build + test passando.
- [ ] Documentação atualizada.

---

## Fase 2 — CLI, erros e cache HTTP

**Objetivo:** Melhorar produção (vitek-serve), tratamento de erros e cache de resposta.

### 2.1 vitek-serve: env e hooks em produção

**Contexto:** `vitek-serve` não lê PORT/HOST de env e não aplica hooks (ex.: beforeApiRequest).

**Ação:**

- Em `parseArgs()`: se `--port` não for passado, usar `process.env.PORT` (e converter para número); idem para `--host` e `process.env.HOST`. Manter defaults atuais quando env não definido.
- Hooks em produção: o bundle da API não tem noção de plugins. Opção (A) gerar no build um pequeno “runtime” que recebe hooks de um arquivo configurável (ex.: `vitek.config.mjs` em dist) e o CLI carrega esse módulo se existir. Opção (B) documentar que, por enquanto, CORS e auth podem ser feitos via reverse proxy ou middleware externo, e que hooks de request são aplicados apenas em dev/preview.
- Recomendação para Fase 2: implementar (A) de forma mínima — se existir `dist/vitek.config.mjs` (ou nome acordado) exportando `beforeApiRequest`, o CLI passar ao `createRequestHandler`; senão, comportamento atual. Assim os hooks passam a funcionar também em produção quando o usuário optar por esse arquivo.

**Testes:**

- `cli/serve.test.ts` (novo ou existente): parseArgs com `process.env.PORT` e `process.env.HOST`; mock de `createRequestHandler` para garantir que, com arquivo de config presente, `beforeApiRequest` é passado.
- Examples: não obrigatório novo example; documentar em `production-server.md` o uso de `vitek.config.mjs` (ou nome final).

**Docs:** `production-server.md` e `production-deploy.md`: variáveis PORT/HOST e (quando implementado) config de hooks em produção.

**Critério de conclusão:** vitek-serve usa PORT/HOST de env; hooks em produção opcionais e testados; docs atualizados.

---

### 2.2 Tratamento de erros em produção (onError)

**Contexto:** Erros são logados e devolvidos como 500 com mensagem; não há customização.

**Ação:**

- Adicionar `onError?: (err: Error, req, res) => void | Promise<void>` em opções do plugin (e no request-handler). Se definido, chamar após captura do erro; o callback pode enviar resposta e evitar o default, ou deixar o default rodar.
- Comportamento default mantido quando `onError` não definido (res 500 + JSON com mensagem; em dev pode incluir stack se desejado).

**Testes:**

- `request-handler.test.ts`: simular erro no handler; com `onError` que envia 503 e chama `res.end()`, resposta deve ser 503; sem `onError`, 500.
- Ajustar testes existentes que esperam 500 para seguir passando.

**Docs:** `configuration.md`, `error-handling.md` (seção “Custom error handler in production”).

**Critério de conclusão:** onError opcional funcionando; testes e docs ok.

---

### 2.3 Helpers de cache HTTP (Cache-Control / ETag)

**Contexto:** Não há helpers para cache de resposta.

**Ação:**

- Adicionar helpers, por exemplo: `cacheControl(maxAgeSeconds, options?)` e `noStore()` que retornam objeto com `headers` (e eventualmente `status`) para usar em resposta (ex.: `{ ...ok(body), headers: { ...ok(body).headers, ...cacheControl(60) } }` ou helper que já compõe com `ok`/`json`).
- Decidir assinatura mínima: ex. `cacheControl(60, { staleWhileRevalidate?: number, private?: boolean })`; `noStore()` retorna `headers: { 'Cache-Control': 'no-store' }`.
- Documentar uso e, se aplicável, ETag manual (ex.: header `ETag` no mesmo objeto de headers).

**Testes:**

- `response-helpers.test.ts`: `cacheControl(60)` e `noStore()` retornam os headers esperados.
- Opcional: um teste de integração no request-handler (resposta com esses headers).

**Docs:** `response-handling.md` (nova seção “Cache headers”).

**Critério de conclusão:** Helpers de cache disponíveis; testes e docs ok.

---

### 2.4 Fase 2 — checklist final

- [ ] vitek-serve: env (PORT/HOST) e hooks em produção (quando config presente) implementados e testados.
- [ ] onError implementado e testado.
- [ ] Helpers de cache implementados e testados.
- [ ] Refatorar testes existentes se necessário.
- [ ] Todos os examples com build + test passando.
- [ ] Documentação atualizada.

---

## Fase 3 — DX e middleware global

**Objetivo:** Inicialização rápida do projeto e mais controle de middleware.

### 3.1 CLI init (npx vitek init)

**Contexto:** Projeto novo exige config manual.

**Ação:**

- Adicionar comando `vitek init` (ou `npx vitek init`): cria `src/api` se não existir, arquivo exemplo `src/api/health.get.ts`, e adiciona/atualiza `vite.config` para incluir `vitek()` (detectar Vite config em js/ts e injetar import + plugin).
- Comportamento idempotente e seguro (não sobrescrever arquivos existentes sem flag, ex. `--force`).

**Testes:**

- Novo `cli/init.test.ts`: em dir temporário, rodar init; verificar existência de `src/api/health.get.ts` e presença de `vitek` no config; rodar init de novo e garantir que não quebra.
- Opcional: um example mínimo “from-init” gerado por script para validar E2E.

**Docs:** `getting-started.md` e README: “Quick start with `npx vitek init`”.

**Critério de conclusão:** `npx vitek init` funciona; testes e docs ok.

---

### 3.2 Middleware global com matcher (opcional)

**Contexto:** Só existem middlewares por pasta; não há um “global” com matcher de path.

**Ação:**

- Permitir um único middleware global (ex.: `middleware.ts` na raiz de `apiDir`) com configuração opcional de matcher: ex. `export const config = { path: ['/api/protected/*'] }` para aplicar apenas a certas rotas. Se não houver `config`, middleware aplica a todas as rotas (comportamento atual quando há um único middleware na raiz).
- Implementação: no carregamento de middlewares, tratar o arquivo raiz como especial; ao compor, aplicar o global primeiro (ou na ordem documentada).

**Testes:**

- `get-applicable-middlewares.test.ts`: cenários com middleware global com/sem matcher; verificar ordem e rotas afetadas.
- `request-handler.test.ts`: um caso com middleware global que faz short-circuit (ex.: 401).

**Docs:** `middlewares.md`: seção “Global middleware and path matcher”.

**Critério de conclusão:** Middleware global com matcher opcional funcionando; testes e docs ok.

---

### 3.3 Fase 3 — checklist final

- [ ] `vitek init` implementado e testado.
- [ ] Middleware global (e matcher) implementado e testado.
- [ ] Refatorar testes de middlewares se necessário.
- [ ] Todos os examples com build + test passando.
- [ ] Documentação atualizada.

---

## Fase 4 — Respostas avançadas e E2E

**Objetivo:** Suporte a mais tipos de resposta e confiabilidade via E2E.

### 4.1 Resposta em texto, HTML e streaming (SSE)

**Contexto:** Respostas são sobretudo JSON; não há convenção para text/html nem streaming.

**Ação:**

- Helpers `text(body: string, status?)` e `html(html: string, status?)` que retornam `VitekResponse` com `Content-Type` adequado.
- Suporte a corpo em stream: definir que `VitekResponse.body` pode ser `ReadableStream` (web) ou `NodeJS.ReadableStream`; no request-handler, se `body` for stream, fazer `pipe` (ou equivalente) em vez de `JSON.stringify`/`res.end(string)`.
- Documentar SSE: exemplo de handler que retorna resposta com stream (e `Content-Type: text/event-stream`).

**Testes:**

- `response-helpers.test.ts`: `text()` e `html()` com headers corretos.
- `request-handler.test.ts`: resposta com body stream (mock de Readable); resposta recebida pelo cliente deve refletir o stream.
- Opcional: example mínimo “sse” ou “streaming” com uma rota SSE e post-build test que verifica se a rota existe e responde.

**Docs:** `response-handling.md`: “Plain text and HTML”, “Streaming and SSE”.

**Critério de conclusão:** text/html e streaming funcionando; testes (e optional example) e docs ok.

---

### 4.2 E2E e benchmark

**Contexto:** Não há suite E2E nem benchmark público.

**Ação:**

- Suite E2E (ex.: Playwright): um workflow que sobe um example (ex.: typescript-react ou basic-js), executa `pnpm build && pnpm start` (vitek-serve) e faz requisições a pelo menos uma rota GET e uma POST; valida status e corpo.
- Script de benchmark (ex.: `scripts/bench.mjs` ou similar): rodar N requisições a uma rota simples (ex.: health) e reportar latência (p50, p99) e throughput; executável em CI de forma opcional (não bloquear merge).

**Testes:**

- E2E: testes Playwright passando no CI para o example escolhido.
- Benchmark: documentar como rodar e, se possível, publicar resultados em branch ou doc.

**Docs:** `development.md` ou README: como rodar E2E e benchmark.

**Critério de conclusão:** E2E passando; benchmark reproduzível e documentado.

---

### 4.3 Fase 4 — checklist final

- [ ] Helpers text/html e streaming (incl. SSE) implementados e testados.
- [ ] E2E com Playwright (ou similar) implementado.
- [ ] Script de benchmark e documentação.
- [ ] Refatorar testes existentes se necessário.
- [ ] Todos os examples com build + test passando.
- [ ] Documentação atualizada.

---

## Fase 5 — Extensões e polish

**Objetivo:** Rate limiting documentado, exemplo opcional e melhorias finais.

### 5.1 Rate limiting e segurança (doc + exemplo)

**Contexto:** Rate limiting não existe no core; pode ser feito via plugin.

**Ação:**

- Documentar em `plugin-api.md` (ou novo “Recipes”): exemplo de plugin `beforeApiRequest` que implementa rate limit por IP (em memória); mencionar que para produção o usuário pode usar Redis ou proxy.
- Opcional: example `example-rate-limit` (ou seção em example existente) que usa esse plugin e tem post-build test verificando que a API sobe e que uma rota responde (e opcionalmente que excesso de requests retorna 429).

**Testes:**

- Se houver example novo: post-build.test e script test no package.json; build-and-test.sh inclui o example.
- Testes unitários do core não obrigatórios para rate limit (é exemplo de uso do plugin).

**Docs:** “Recipes” ou “Plugin API” com exemplo de rate limiting.

**Critério de conclusão:** Doc (e optional example) de rate limiting; build-and-test passando para todos os examples.

---

### 5.2 Ajustes finais e cobertura

**Contexto:** Garantir consistência e cobertura após todas as fases.

**Ação:**

- Revisar todos os novos arquivos de teste; garantir que exemplos têm `post-build.test.*` e `test` no package.json onde faz sentido.
- Refatorar testes antigos que ficaram frágeis ou duplicados.
- Atualizar `docs/guide/testing.md` com estrutura atual (unit, post-build, E2E, benchmark).
- Checar links e referências nas docs (configuration, production, plugin-api, response-handling).

**Critério de conclusão:** Cobertura e estrutura de testes documentadas; links e docs consistentes.

---

## Fase 6 — Lifecycle em produção e cron in-process

**Objetivo:** Permitir que aplicações rodem lógica agendada (cron, interval) dentro do mesmo processo do vitek-serve, de forma automatizada, sem depender de cron externo + rota protegida.

### 6.1 Hook onServerStart (e opcional onServerShutdown)

**Contexto:** O vitek-serve só reage a requests (HTTP + WebSockets) e aos hooks beforeApiRequest/onError. Não há ponto de entrada “ao subir o servidor” nem “ao desligar”. Para cron/jobs in-process, o usuário precisa poder iniciar timers (setInterval, node-cron, etc.) quando o servidor sobe.

**Ação:**

- Em **vitek.config.mjs** (produção), suportar export opcional **`onServerStart(ctx)`**. Assinatura sugerida: `ctx` com `{ api?, sockets?, server? }` (o cliente interno da API e o emitter de sockets já existentes no processo; opcionalmente a instância `http.Server` para cleanup).
- O **vitek-serve** (em `serve.ts`), após montar o app e **antes** de `server.listen`, carregar `vitek.config.mjs` e, se existir `onServerStart`, chamá-lo uma vez passando esse contexto. Assim o usuário pode, dentro do hook, usar `setInterval`, `node-cron`, ou chamar `api.fetch('/api/jobs/...')` para disparar jobs.
- Opcional: **`onServerShutdown()`** exportado em vitek.config.mjs; vitek-serve regista `process.on('SIGTERM'|'SIGINT')` e chama esse hook antes de encerrar, para o usuário cancelar timers ou fechar conexões.

**Testes:**

- `serve.test.ts`: com mock de dist contendo vitek.config.mjs que exporta `onServerStart`, garantir que o hook é chamado uma vez após carregar o config (e que recebe objeto com `api` ou propriedades acordadas). Opcional: teste com `onServerShutdown`.
- Não quebrar cenário em que vitek.config.mjs não exporta onServerStart (comportamento atual).

**Docs:** `production-server.md`: seção “Lifecycle hooks (onServerStart / onServerShutdown)”, com exemplo de cron in-process usando `setInterval` ou `node-cron` e chamando uma rota interna ou executando lógica direta.

**Critério de conclusão:** onServerStart (e opcionalmente onServerShutdown) funcionando em produção; testes e docs ok.

---

### 6.2 Schedules declarativos (opcional)

**Contexto:** Além do hook genérico, algumas aplicações podem preferir declarar “a cada X” ou “cron expression” em vez de escrever setInterval/node-cron no onServerStart.

**Ação:**

- Se fizer sentido em fase posterior: em vitek.config.mjs, suportar export opcional **`schedules`**: array de `{ cron?: string, intervalMs?: number, handler: () => void | Promise<void> }`. O vitek-serve interpretaria e iniciaria os agendamentos (ex.: com dependência opcional `node-cron` ou apenas `setInterval` para intervalMs).
- Manter onServerStart como forma flexível; schedules seria conveniência em cima disso ou implementação nativa no serve.

**Testes e docs:** Se implementado, testes em serve.test.ts e documentação em production-server.md.

**Critério de conclusão:** Opcional; pode ficar para fase seguinte. Prioridade: 6.1 (onServerStart).

---

### 6.3 Fase 6 — checklist final

- [ ] onServerStart em vitek.config.mjs implementado e testado.
- [ ] (Opcional) onServerShutdown implementado e testado.
- [ ] Documentação em production-server.md com exemplo de cron in-process.
- [ ] Todos os examples com build + test passando.
- [ ] (Opcional) schedules declarativos; senão, deixar para fase futura.

---

## Cobertura das Fases 1–3 nos examples

**Objetivo:** Garantir que cada feature das Fases 1–3 apareça em pelo menos um example, com testes (post-build e, quando fizer sentido, integração) para validar.

**Estratégia:** Reaproveitar examples existentes; criar novo example só se a combinação de features ficar confusa.

### Mapa feature → example

| Feature | Example | Onde / como |
|--------|---------|-------------|
| **CORS** (opção no plugin) | basic-js | `cors: true` em `vite.config.js`; README menciona CORS em produção. |
| **trustProxy** | docker | `trustProxy: true` no plugin; script de start com `--trust-proxy` quando atrás de proxy; README. |
| **onError** (dev + prod) | basic-js (dev), docker (prod) | basic-js: `onError` em `vite.config.js`. docker: `onError` em `vitek.config.mjs`. |
| **cacheControl / noStore** | basic-js | Uma rota (ex.: `GET /api/posts` ou `cache.get.js`) que usa `cacheControl(60)` ou `noStore()`. |
| **vitek.config.mjs** (produção) | docker | Arquivo na raiz (ou `config/`), copiado para `dist/` no build/Dockerfile; exportar `beforeApiRequest` e `onError`. |
| **Middleware global com path** (`config.path`) | typescript-react | Em `src/api/middleware.ts`, `export const config = { path: ['/api/users/*', ...] }`; comentário. |

Nenhum example novo obrigatório: basic-js, docker e typescript-react cobrem tudo.

---

### 1. Example basic-js

**Implementação:**

- **CORS:** Em `vite.config.js`, adicionar `vitek({ cors: true })`. README: na seção de produção, mencionar CORS (plugin ou proxy).
- **onError (dev):** Em `vite.config.js`, adicionar `onError` (ex.: log + resposta 500 customizada) para mostrar a opção.
- **cacheControl / noStore:** Criar rota que use os helpers (ex.: `src/api/cache.get.js` com `cacheControl(60)` ou em `posts/index.get.js` usar `noStore()`/`cacheControl(...)`). Garantir que uma resposta tenha header `Cache-Control`.

**Testes:**

- **Post-build (post-build.test.js):**
  - Manter todos os testes atuais (dist, bundles, load vitek-api.mjs).
  - Adicionar: verificar que existe rota que expõe cache (ex.: se criou `cache.get.js`, checar que `routes` no bundle inclui path correspondente; ou que o handler da rota de posts/cache está presente).
  - Adicionar (opcional, se não pesar): teste que sobe o servidor (`vitek-serve` ou `createRequestHandler`), faz `GET /api/cache` (ou a rota com cache) e verifica que a resposta tem header `Cache-Control` (ex.: `max-age=60` ou `no-store`). Se o exemplo usar apenas checagem estática do bundle, documentar no README do example que a rota demonstra cache.
- Garantir que `pnpm run build && pnpm test` passam.

**Checklist basic-js:**

- [ ] `vite.config.js`: `cors: true` e `onError`.
- [ ] Pelo menos uma rota usando `cacheControl` ou `noStore`.
- [ ] README atualizado (CORS, cache, referência a onError).
- [ ] Post-build test atualizado (rota de cache no bundle e, se possível, assertiva de Cache-Control em resposta).
- [ ] `pnpm build` e `pnpm test` passando.

---

### 2. Example docker

**Implementação:**

- **trustProxy:** Em `vite.config.ts`, `trustProxy: true`. No script de produção (e Dockerfile/compose prod), usar `vitek-serve --trust-proxy` quando atrás de proxy. README: explicar uso atrás de proxy.
- **vitek.config.mjs:** Criar `vitek.config.mjs` na raiz (ou `config/vitek.config.mjs`) exportando `beforeApiRequest` e `onError`. Garantir cópia para `dist/` no build (script pós-build ou `COPY` no Dockerfile). README e doc: referência a production config.

**Testes:**

- **Post-build (post-build.test.ts):**
  - Manter testes atuais (dist, bundles, load vitek-api.mjs).
  - Adicionar: após o build, verificar que `dist/vitek.config.mjs` existe (o script de build deve copiar o arquivo para dist).
  - Adicionar (opcional): carregar `dist/vitek.config.mjs` e verificar que exporta `beforeApiRequest` e `onError` (funções).
- Garantir que `pnpm run build && pnpm test` passam no example; se possível, rodar uma vez `docker compose -f docker-compose.prod.yml up --build` (ou documentar que é manual) para validar que a imagem inclui `vitek.config.mjs` em dist.

**Checklist docker:**

- [ ] `vite.config.ts`: `trustProxy: true`.
- [ ] `vitek.config.mjs` criado com `beforeApiRequest` e `onError`.
- [ ] Build (e Docker prod) copiam `vitek.config.mjs` para `dist/`.
- [ ] README atualizado (trustProxy, production config, --trust-proxy).
- [ ] Post-build test: existe `dist/vitek.config.mjs` e (opcional) exports corretos.
- [ ] `pnpm build` e `pnpm test` passando.

---

### 3. Example typescript-react

**Implementação:**

- **Middleware global com path matcher:** Em `src/api/middleware.ts`, adicionar `export const config = { path: ['/api/users/*', '/api/posts/*'] }`. Comentário no topo: "Global middleware with path matcher: only runs for /api/users/* and /api/posts/*". Garantir que exista ao menos uma rota fora do matcher (ex.: `/api/health`) para demonstrar que o global não aplica a todas.

**Testes:**

- **Post-build (post-build.test.ts):**
  - Manter testes atuais (dist, bundles, routes, middlewares).
  - Adicionar: ao carregar `vitek-api.mjs`, verificar que `mod.middlewares` está definido e que há pelo menos um middleware (o global). Se a estrutura do bundle expuser que o middleware global tem matcher de path (ex.: metadados ou ordem de rotas), assertar; caso contrário, basta garantir que o build inclui middlewares e que a app continua funcionando (rota sem middleware e rota com middleware).
- Garantir que `pnpm run build && pnpm test` passam.

**Checklist typescript-react:**

- [ ] `config.path` em `src/api/middleware.ts`.
- [ ] Comentário e rota fora do matcher para demonstração.
- [ ] Post-build test: middlewares presentes no bundle.
- [ ] `pnpm build` e `pnpm test` passando.

---

### Ordem de implementação sugerida

1. **basic-js:** CORS + rota com cache + onError no vite.config + README; em seguida atualizar post-build.test.js (rota de cache, opcional Cache-Control em resposta).
2. **typescript-react:** config.path no middleware global + comentário; atualizar post-build.test.ts (middlewares no bundle).
3. **docker:** trustProxy, vitek.config.mjs e cópia para dist + README; atualizar post-build.test.ts (existência e exports de dist/vitek.config.mjs).

---

### Testes globais (examples)

- **build-and-test.sh:** Manter os 8 examples; após as mudanças, rodar `./examples/build-and-test.sh` e corrigir falhas (ex.: prisma EPERM em ambiente restrito pode ser documentada ou ignorada no script se necessário).
- **Regra:** Todo example alterado deve ter `test` no package.json e post-build test cobrindo as novas partes (CORS/onError podem ser apenas config e não assertados no post-build se não subirmos servidor; cache: assertar rota ou header; vitek.config.mjs: assertar arquivo e exports; middleware path: assertar middlewares no bundle).

---

### Resumo

- **3 examples alterados:** basic-js, docker, typescript-react.
- **0 examples novos** para Fases 1–3.
- **Cobertura:** CORS, trustProxy, onError (dev + prod), cacheControl/noStore, vitek.config.mjs, middleware global com config.path.
- **Testes:** Cada example tem checklist de testes (post-build atualizado + script test); build-and-test.sh continua passando para todos.

---

## Resumo por fase

| Fase | Foco principal                         | Entregas principais                                      |
|------|----------------------------------------|----------------------------------------------------------|
| **1** | CORS e proxy                           | CORS configurável; X-Forwarded-* e trustProxy; testes e docs. |
| **2** | CLI, erros, cache HTTP                 | PORT/HOST no vitek-serve; hooks em prod; onError; cacheControl/noStore; testes e docs. |
| **3** | DX e middleware global                 | vitek init; middleware global com matcher; testes e docs. |
| **4** | Respostas e E2E                        | text/html/stream/SSE; E2E Playwright; benchmark; testes e docs. |
| **5** | Extensões e polish                     | Doc (e optional example) rate limit; revisão testes e docs. |
| **6** | Lifecycle e cron in-process            | onServerStart (e opcional onServerShutdown) em vitek.config.mjs; cron/jobs no mesmo processo; docs. |

---

## Regras gerais (todas as fases)

1. **Nada quebra:** ao final de cada fase, `pnpm build` e `pnpm test` passam; `examples/build-and-test.sh` passa (ou ajustar script se novo example for adicionado).
2. **Testes:** toda feature nova tem teste unitário (ou de integração) no core; novos examples têm post-build test e script `test`.
3. **Refatorar testes:** se a API do request-handler, do plugin ou do CLI mudar, ajustar testes existentes na mesma fase.
4. **Docs:** opções novas em `configuration.md`; comportamentos novos nas guias correspondentes; links internos revisados.
5. **Novo example:** só criar quando a feature for mais clara com um example dedicado; quando criado, incluí-lo em `examples/README.md` e em `build-and-test.sh`.
6. **Cobertura nos examples (Fases 1–3):** aplicar features e testes conforme a seção [Cobertura das Fases 1–3 nos examples](#cobertura-das-fases-13-nos-examples); todo example alterado deve ter post-build test atualizado e `pnpm test` passando.

---

*Documento criado em fev/2025. Atualizar conforme conclusão das fases e prioridades do projeto.*
