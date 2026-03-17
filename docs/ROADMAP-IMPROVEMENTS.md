# Vitek Plugin — Roadmap de Melhorias (Plano Step-by-step)

> Alvo: sair de “beta promissor” para “package de referência” no ecossistema Vite, sem perder simplicidade.
>
> Versão base: `0.2.1-beta`
>
> Princípios:
> - **Compatibilidade previsível**: mudanças grandes precisam de fase de transição e docs.
> - **DX primeiro**: onboarding, testes e exemplos como produto.
> - **Build/CI como guardrail**: toda mudança vem com testes (unit + examples post-build + e2e quando aplicável).
> - **Modo**: não depender de `NODE_ENV` para inferir “dev vs prod” no Vite; preferir `mode`/config do Vite.

---

## 0) Checklist de release antes de começar

- **Definir suporte de Vite**:
  - **Obrigatório**: Vite 7 (CI bloqueante).
  - **Best-effort**: Vite 6 por 1–2 releases (CI não-bloqueante ou subset).
  - **Descontinuado**: Vite 5.
- **Definir política de breaking changes**:
  - Qualquer alteração de entrypoint/exports: documentar e garantir período de compat.
- **Atualizar “Definition of Done”**:
  - `pnpm run check` precisa passar.
  - Todo exemplo modificado precisa ter post-build test cobrindo o caso novo.

### 0.1 Auditoria de compatibilidade (Vite 5 → removido)

Objetivo: identificar e remover comportamentos condicionais criados apenas para contornar limitações do Vite 5.

Checklist:
- Buscar por referências a “Vite 5”, condicionais de feature-detection antigas e workarounds.
- Remover branches que existam apenas para Vite 5 (ou mover para best-effort de Vite 6 se ainda fizer sentido).
- Atualizar docs:
  - badges (README/docs)
  - guide/installation
  - support policy

---

## 1) Exports granulares (alto impacto, baixo risco se bem feito)

### Objetivo
Evitar que usuários importem “tudo” de `vitek-plugin` quando só precisam de helpers específicos (ex.: `json`, `HttpError`, `validateBody`), e permitir imports mais semânticos:

- `vitek-plugin` (default/compat): mantém API atual (barrel) por um tempo.
- `vitek-plugin/plugin`: apenas `vitek()` e tipos relacionados ao plugin Vite.
- `vitek-plugin/response`: helpers de response.
- `vitek-plugin/errors`: errors.
- `vitek-plugin/validation`: validação.
- `vitek-plugin/introspection`: manifest/routes/sockets helpers.
- `vitek-plugin/testing`: utilitários para testes (ver seção 2).
- `vitek-plugin/types`: tipos públicos (opcional, dependendo do design).

### Use cases
- **Routes** importam só o que precisam:

```ts
import { json } from 'vitek-plugin/response'
import { NotFoundError } from 'vitek-plugin/errors'
import { validateBody } from 'vitek-plugin/validation'
```

- **App** usa o plugin no Vite config sem carregar barrel de runtime:

```ts
import { vitek } from 'vitek-plugin/plugin'
```

### Passo a passo

#### 1.1 Mapear API pública atual
- Listar todos os exports públicos atuais (do `src/index.ts` e do `src/plugin.ts`/`src/plugin/vitek.ts`).
- Separar por domínio: `plugin`, `response`, `errors`, `validation`, `introspection`, `websockets`, `types`.

#### 1.2 Criar entrypoints fonte (TypeScript) por domínio
Estrutura sugerida (mantendo o que já existe, só adicionando “barrels” por área):

```
src/
  public/
    plugin.ts
    response.ts
    errors.ts
    validation.ts
    introspection.ts
    testing.ts
    types.ts
  index.ts
```

- `src/index.ts` continua exportando tudo **por compatibilidade**.
- Cada arquivo em `src/public/*` exporta só o subset.

#### 1.3 Ajustar `package.json` exports
Adicionar exports por subpath, mantendo `.` como compat:

```json
{
  "exports": {
    ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" },
    "./plugin": { "import": "./dist/public/plugin.js", "types": "./dist/public/plugin.d.ts" },
    "./response": { "import": "./dist/public/response.js", "types": "./dist/public/response.d.ts" },
    "./errors": { "import": "./dist/public/errors.js", "types": "./dist/public/errors.d.ts" },
    "./validation": { "import": "./dist/public/validation.js", "types": "./dist/public/validation.d.ts" },
    "./introspection": { "import": "./dist/public/introspection.js", "types": "./dist/public/introspection.d.ts" },
    "./testing": { "import": "./dist/public/testing.js", "types": "./dist/public/testing.d.ts" }
  }
}
```

#### 1.4 Atualizar docs
- `docs/guide/imports.md`: seção “Recommended imports” com exemplos de subpaths.
- `docs/guide/getting-started.md`: atualizar snippets.

#### 1.5 Atualizar examples
Aplicar nos exemplos para mostrar o estilo novo (sem quebrar compat):
- Em routes: trocar `import { json } from 'vitek-plugin'` por `vitek-plugin/response` quando fizer sentido.
- Em `vite.config.*`: trocar `import { vitek } from 'vitek-plugin'` por `vitek-plugin/plugin`.

#### 1.6 Testes
- Unit: adicionar um teste que garante que os entrypoints existem após build (ex.: import dinâmico de `dist/public/*`).
- Examples post-build: incluir pelo menos 1 exemplo usando os novos subpaths.

#### 1.7 Rollout
- Release N: introduz subpaths + docs + exemplos.
- Release N+1/N+2: sugerir migração (docs). Só deprecar o barrel se houver sinal.

---

## 2) `vitek-plugin/testing` (test utils oficiais)

### Objetivo
Permitir que usuários testem handlers e middlewares sem reimplementar mocks de `req/res/context`.

### Use cases

#### 2.1 Testar um handler isolado
```ts
import { describe, it, expect } from 'vitest'
import { createMockContext } from 'vitek-plugin/testing'
import handler from './[id].get'

describe('GET /users/:id', () => {
  it('retorna o usuário', async () => {
    const ctx = createMockContext({ params: { id: '42' } })
    const res = await handler(ctx)
    expect(res).toMatchObject({ id: 42 })
  })
})
```

#### 2.2 Testar middleware
```ts
import { createMockContext, runMiddlewareChain } from 'vitek-plugin/testing'

const ctx = createMockContext({ headers: { authorization: 'Bearer token' } })
await runMiddlewareChain(ctx, [authMiddleware])
```

### Passo a passo

#### 2.1 Definir superfície mínima
- `createMockContext(overrides?)`
- `createMockReq(overrides?)`
- `createMockRes()` (com headers, statusCode, body capturável)
- Helpers opcionais:
  - `runMiddlewareChain(ctx, middlewares)` para executar o `compose` interno.

#### 2.2 Implementar em runtime Node (sem dependências externas)
- Os mocks podem ser “POJOs” com shape compatível com o que o Vitek usa (não precisa ser `IncomingMessage` real se o core não exigir).

#### 2.3 Testes
- Unit tests em `src/public/testing.test.ts` cobrindo:
  - defaults
  - overrides
  - headers
  - execução de middleware chain (se existir)

#### 2.4 Docs
- `docs/guide/testing.md`: adicionar uma seção “Testing handlers with vitek-plugin/testing”.
- Atualizar pelo menos 1 example com testes de handler (ex.: `examples/minimal-ts` ou `examples/typescript-react`).

---

## 3) Changesets + automação de release (fundação para crescer)

### Objetivo
Padronizar versões e releases (especialmente com `packages/vitek-mcp`), evitando “esquecer” mudanças em docs/examples.

### Passo a passo
- Introduzir `@changesets/cli` e workflow de release.
- Definir regra:
  - mudanças em `docs/` apenas podem gerar “bypass” (ou patch, dependendo da estratégia).
  - mudanças em `examples/` normalmente não mudam versão do pacote, mas podem justificar patch se corrigirem bugs.
- Atualizar `docs/contributing.md` com o fluxo:
  - `pnpm changeset`
  - merge na `main`
  - GH Action cria release e publica.

### Use case: release com subpath exports
- Criar changeset com `minor` (ou `patch` se for estritamente aditivo e compat).

---

## 4) Modo dev/prod: política clara (Vite vs Node)

### Objetivo
Evitar comportamento “surpresa” por depender de `NODE_ENV`.

### Regras recomendadas
- **Dentro do plugin no Vite**:
  - usar o `mode` do Vite (capturado em `configResolved`) para toggles de dev/prod.
- **No `vitek-serve` (Node)**:
  - aceitar `--mode` (ou `--env`) e usar `NODE_ENV` apenas como default.

### Tarefas
- Mapear todos os pontos que leem `process.env.NODE_ENV` no repo.
- Definir um helper único (ex.: `isProduction(mode, nodeEnv)`).
- Documentar em `docs/guide/production-server.md` e `docs/guide/production-deploy.md`.

### Use cases
- Logs detalhados só em dev.
- Mensagens de erro em produção sem stack trace (ou com opt-in).

---

## 5) Atualizações obrigatórias em examples + tests (para não “passar nada”)

### Objetivo
Toda mudança de DX/exports/test utils precisa estar demonstrada e coberta nos exemplos.

### Checklist por mudança
- **Docs**: atualizar guia correspondente + snippet “Getting started”.
- **Examples**:
  - atualizar `vite.config.*` para `vitek-plugin/plugin` quando fizer sentido.
  - atualizar rotas para usar `vitek-plugin/response|errors|validation` (quando aplicável).
- **Post-build tests (examples)**:
  - garantir que o build gera bundles esperados
  - adicionar pelo menos um assert de import usando subpath exports (ex.: tentar importar `vitek-plugin/response` dentro do exemplo).
- **Unit tests**:
  - novos entrypoints exportados
  - `testing` utils
- **E2E**:
  - se a mudança mexer em runtime/serve, rodar `pnpm test:e2e` e `pnpm test:e2e:socket`.

### Exemplos recomendados para cobrir novidades
- `examples/minimal-ts`: bom para demonstrar `vitek-plugin/plugin` e `vitek-plugin/response`.
- `examples/typescript-react`: bom para validar `validation` e typing.
- `examples/socket-only`: bom para garantir que MCP/e2e sockets continuam ok.
- `examples/docker`: bom para SSR + alias + DX (já cobre).
- `examples/prisma`: bom para CI de dependências e build real.

---

## 6) Sequência recomendada de execução (ordem que reduz risco)

1. **Exports granulares (somente aditivo)** + docs + 1–2 exemplos migrados
2. **`vitek-plugin/testing`** + docs + exemplo demonstrando teste de handler
3. **Changesets + release workflow**
4. **Política de mode (dev/prod) documentada e unificada**
5. Refactors estruturais (split shared/*) quando exports já estiverem estáveis
6. Decisão de monorepo/split CLI/serve (quando a API estiver mais estável)

---

## 7) Critérios de aceitação (para cada PR)

- `pnpm run check` passa.
- Pelo menos **1 example** atualizado para o novo comportamento (quando aplicável).
- Pelo menos **1 post-build test** atualizado/adicionado para cobrir o caso.
- Docs atualizadas com:
  - seção “Why”
  - seção “How to use”
  - snippet de código
  - nota de compatibilidade quando necessário

