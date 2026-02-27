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

## Resumo por fase

| Fase | Foco principal                         | Entregas principais                                      |
|------|----------------------------------------|----------------------------------------------------------|
| **1** | CORS e proxy                           | CORS configurável; X-Forwarded-* e trustProxy; testes e docs. |
| **2** | CLI, erros, cache HTTP                 | PORT/HOST no vitek-serve; hooks em prod; onError; cacheControl/noStore; testes e docs. |
| **3** | DX e middleware global                 | vitek init; middleware global com matcher; testes e docs. |
| **4** | Respostas e E2E                        | text/html/stream/SSE; E2E Playwright; benchmark; testes e docs. |
| **5** | Extensões e polish                     | Doc (e optional example) rate limit; revisão testes e docs. |

---

## Regras gerais (todas as fases)

1. **Nada quebra:** ao final de cada fase, `pnpm build` e `pnpm test` passam; `examples/build-and-test.sh` passa (ou ajustar script se novo example for adicionado).
2. **Testes:** toda feature nova tem teste unitário (ou de integração) no core; novos examples têm post-build test e script `test`.
3. **Refatorar testes:** se a API do request-handler, do plugin ou do CLI mudar, ajustar testes existentes na mesma fase.
4. **Docs:** opções novas em `configuration.md`; comportamentos novos nas guias correspondentes; links internos revisados.
5. **Novo example:** só criar quando a feature for mais clara com um example dedicado; quando criado, incluí-lo em `examples/README.md` e em `build-and-test.sh`.

---

*Documento criado em fev/2025. Atualizar conforme conclusão das fases e prioridades do projeto.*
