# Plano: pastas `showcases/` — aplicações quase reais

Este documento define **o que são showcases**, **como se diferenciam de `examples/`**, **quais casos de uso cobrir**, **que features do Vitek priorizar**, e **como executar o trabalho em fases**.  

**Regra explícita:** os **micro-exemplos** em `examples/` permanecem como estão (receitas isoladas, CI rápido, um conceito por pasta). **Nada neste plano exige alterar ficheiros em `examples/`.**

---

## 1. Problema que os showcases resolvem

### 1.1 Situação atual

- `examples/` é excelente para: “como ligo só CORS?”, “como faço rate-limit com plugin?”, “como corro `vitek contract check`?”.
- Quem avalia o Vitek para **adotar em produto** costuma perguntar: *“Isso escala mentalmente quando tenho auth, CRUD, websockets, docs, CI e deploy no mesmo repo?”*

### 1.2 O que falta

Uma ou mais **aplicações narrativas** (quase produto), onde:

- várias features aparecem **no mesmo fluxo de utilizador**;
- o README conta uma **história** (persona + objetivo), não só uma lista de toggles;
- o leitor vê **valor acumulado**: file-based routes + tipos + cliente gerado + OpenAPI + (opcional) sockets + produção com `vitek-serve`.

### 1.3 Objetivo dos showcases

| Objetivo | Descrição |
|----------|-----------|
| **Inspirar** | Mostrar “isto parece um produto”, não um snippet. |
| **Ensinar integração** | Como encaixar peças que hoje estão em `examples/` diferentes. |
| **Reduzir risco de adoção** | Provar que o modelo file-based aguenta um domínio pequeno mas credível. |
| **Apontar para docs** | Cada showcase linka para guias e para `examples/*` quando o leitor quiser só um detalhe. |

---

## 2. `examples/` vs `showcases/`

### 2.1 Comparação direta

| Dimensão | `examples/` | `showcases/` |
|----------|-------------|--------------|
| **Propósito** | Uma feature ou integração mínima. | Vários pilares do Vitek numa única app coerente. |
| **Tamanho** | Poucos ficheiros, rotas mínimas. | Dezenas de ficheiros, domínio mínimo viável. |
| **Narrativa** | “O que este repo demonstra” em bullet points. | Persona, fluxos, decisões de arquitetura. |
| **CI** | Deve continuar rápido e abrangente. | Pode ser mais pesado; pode rodar em job/workflow separado. |
| **Manutenção** | Muitas pastas pequenas, baixo acoplamento. | Poucos projetos; cada um é um “produto” a manter. |

### 2.2 O que **não** migrar para showcases

Coisas que devem **permanecer apenas em `examples/`** (simples, didáticas):

- Um único truque: `validation-only`, `cors`, `build-api-false`, `rate-limit`, `alias`, etc.
- Variantes de stack mínimas: `basic-js`, `js-react`, `vite6-minimal`.
- Integrações “de laboratório” por ferramenta: `prisma`, `docker` como referência de stack, `mcp-project` como smoke MCP.

Os showcases **referenciam** esses exemplos no texto (“detalhe de CORS → `examples/cors`”), em vez de duplicar a finalidade.

---

## 3. Princípios de desenho (todos os showcases)

1. **Domínio legível** — Qualquer dev entende o negócio em 2 minutos (ex.: filas de trabalho, inventário, eventos internos).
2. **TypeScript por defeito** — Alinha com geração de tipos, serviços e OpenAPI; JS só se houver razão forte de audiência.
3. **Frontend opcional mas recomendado** — Pelo menos um showcase com UI que consome `api.services.ts` para mostrar o ciclo completo.
4. **Produção explícita** — README com `vite build` + `vitek-serve` (e, se aplicável, Docker ou nota de deploy).
5. **Segurança em cena** — Pelo menos um path com `maxBodySize`, CORS restrito ou `trustProxy` documentado (sem fingir segurança enterprise; só padrões honestos).
6. **Testes significativos** — Post-build ou testes de integração leves que validem **comportamento**, não só `existsSync(dist)`.
7. **Sem dependências pesadas por defeito** — Preferir SQLite/Prisma num showcase “dados”; evitar filas cloud reais na v1.
8. **Plataforma AI opcional** — Um showcase pode incluir `vitek.platform.json` + uma feature (`observability`, `issueDispatch`, etc.) **se** a história justificar; não forçar todas as flags em todos os projetos.

---

## 4. Features do Vitek a priorizar (mapa de valor)

Esta tabela liga **capacidade do produto** ao **porquê** aparecer num showcase.

| Feature / área | Valor percebido no mundo real | Onde brilha num showcase |
|------------------|-------------------------------|---------------------------|
| **File-based routes + hierarquia** | Velocidade de iterar, revisão em PR por diff claro | CRUD com `users/[id].get.ts`, `posts/index.post.ts`, etc. |
| **Geração de tipos + `api.services.ts`** | Menos drift entre UI e API | UI chama funções geradas com tipos de query/body. |
| **OpenAPI + AsyncAPI + `api-docs.html`** | Contrato vivo para equipas e ferramentas | README com link local e nota de CI com contract. |
| **WebSockets** | Real-time sem segundo servidor ad hoc | Notificações ou presença ligadas a eventos de domínio. |
| **Middlewares** | Auth, tenancy, logging por prefixo | `middleware.ts` em ramos `admin/*` vs `public/*`. |
| **Validation + errors** | APIs previsíveis | 422 + `HttpError` / classes do pacote; mensagens consistentes. |
| **Plugin API (`beforeApiRequest`, etc.)** | Cross-cutting sem poluir handlers | Rate limit, request id, ou cabeçalhos de política. |
| **`vitek-serve` + `vitek.config.mjs` em dist** | Um processo para estático + API | README “Production” copiável. |
| **Contract drift (`vitek contract`)** | CI que protege o contrato público | Commit de snapshot + `check` no CI do showcase. |
| **`vitek.platform.json` + observability / dispatch / doctor / events / schedule** | Plataforma operacional e AI-adjacent | Um showcase “ops” ou um capítulo dentro de um showcase maior. |
| **Alias** | Imports estáveis em apps grandes | `@domain/`, `@lib/` em rotas e serviços partilhados. |
| **Introspection (`getManifest`, etc.)** | Tooling interno, codegen | Script opcional ou teste que lista rotas. |
| **MCP (`vitek mcp`)** | Integração com IDEs | Secção “Para equipas com MCP” com pointer para `examples/mcp-project` ou config espelhada. |

**Ordem de prioridade sugerida para a primeira vaga de showcases:** (1) rotas + tipos + OpenAPI + UI, (2) produção + contract, (3) sockets + eventos, (4) plataforma (observability/issue/events/schedule) como camada opcional ou segundo showcase.

---

## 5. Estrutura de repositório proposta

```
showcases/
  README.md                 # Índice, filosofia, como correr CI
  <slug>/
    README.md               # História, personas, fluxos, comandos, links
    package.json
    vite.config.ts
    src/
      api/                  # Rotas file-based (coração do Vitek)
      lib/                  # Domínio, repos in-memory ou Prisma
      ...                   # Frontend se existir
    .vitek/contract/        # Opcional: snapshots para contract check
    vitek.platform.json     # Opcional
```

**Scripts na raiz do monorepo:** `showcases:build`, `showcases:test`, `showcases:build-and-test` (ver `showcases/*.sh` e `package.json` da raiz); listas explícitas de slugs como em `examples/`.

---

## 6. Showcases propostos (especificação)

Abaixo: **três** showcases com histórias distintas. Quantidade final pode ser 2–4; recomenda-se **não** ultrapassar 4 na v1 para manter manutenção sustentável.

---

### Showcase A — **“OpsBoard”** (B2B leve: equipas, tarefas, painel)

#### 6.A.1 Pitch em uma frase

Pequena aplicação de **gestão de tarefas por equipa** com painel web, API tipada, documentação OpenAPI e fluxo de produção com `vitek-serve`.

#### 6.A.2 Personas e use cases

| Persona | Objetivo | Fluxo principal |
|---------|----------|----------------|
| **PM / lead** | Ver estado das tarefas por equipa | GET lista com filtros de query; UI com tabela |
| **Developer** | Criar e atribuir tarefas | POST com body tipado; validação de campos obrigatórios |
| **Ops** | Auditar mudanças recentes | Rota de “activity” ou lista ordenada; opcional event bus interno |
| **DevOps** | Imagem Docker ou comando único para demo | README com build + start |

#### 6.A.3 Features Vitek a demonstrar (obrigatório vs opcional)

| Feature | Obrigatório? | Como aparece no domínio |
|---------|--------------|-------------------------|
| Rotas + dynamic params | Sim | `tasks/[id].get.ts`, `teams/[id]/tasks.get.ts` |
| Tipos + `api.services.ts` | Sim | UI importa serviços gerados |
| `validateBody` / erros | Sim | Criação de tarefa com 422 |
| OpenAPI | Sim | `openApi: true` ou objeto com `info` do produto |
| Middleware | Sim | Auth **falsa** por header (`X-User-Id`) ou cookie mock; ramo `admin` vs público |
| Contract em CI | Recomendado | `.vitek/contract/openapi.snapshot.json` + `vitek contract check` em `pnpm test` |
| WebSockets | Opcional | Canal “task-updated” para o painel atualizar |
| `vitek-serve` | Sim | Secção Production no README |
| `vitek.platform.json` | Opcional | `observability: true` + `withSpan` num handler de relatório |

#### 6.A.4 Entregáveis

- README com: arquitetura em diagrama textual, comandos `dev` / `build` / `start`, link para `docs/guide/openapi.md`, `docs/guide/production-server.md`, `docs/guide/contract.md`.
- Testes: pelo menos invocação de handlers ou import do bundle com asserts de forma de resposta (evitar testes vazios).

#### 6.A.5 Ponteiros para `examples/` (sem os alterar)

- OpenAPI rico: `examples/api-docs`
- TypeScript + React: `examples/typescript-react`
- Contract: `examples/minimal-ts`
- Middleware: guia + `examples/typescript-react`

---

### Showcase B — **“StockPulse”** (inventário + tempo real)

#### 6.B.1 Pitch em uma frase

Sistema de **stock** com movimentações, alertas de baixo stock e **atualizações em tempo real** via WebSocket.

#### 6.B.2 Personas e use cases

| Persona | Objetivo | Fluxo |
|---------|----------|--------|
| **Armazém** | Registar entrada/saída | POST movimento; validação de quantidade |
| **Loja** | Ver níveis atuais | GET por SKU ou lista |
| **Gestor** | Receber alerta quando stock &lt; mínimo | Socket emite evento; UI subscreve |

#### 6.B.3 Features Vitek a demonstrar

| Feature | Papel |
|---------|--------|
| REST + validação | Movimentações e regras de negócio simples |
| **AsyncAPI + sockets** | Documentação e exemplo vivo de WS |
| `VitekSocketContext` | Handler `*.socket.ts` com mensagens tipadas em convenção interna |
| Response helpers | `created`, `notFound`, `conflict` para SKUs duplicados |
| Opcional: **Events** (`createEventBus`) | Domínio emite `StockChanged`; HTTP persiste; WS notifica |

#### 6.B.4 Porque é diferente do Showcase A

- Centro de gravidade em **WebSockets + AsyncAPI**, não só CRUD + painel.
- Bom para leitores que perguntam “REST e WS no mesmo projeto Vite?”.

#### 6.B.5 Ponteiros para `examples/`

- `examples/socket-only`, `examples/api-docs` (tabs REST + WS)
- `examples/platform-events` (se quiseres mostrar bus + HTTP)

---

### Showcase C — **“ReliableAPI”** (produção, segurança leve, plugin + plataforma)

#### 6.C.1 Pitch em uma frase

API **orientada a integrações** (webhooks fictícios, health, métricas simples) com ênfase em **`onError`**, **limites de body**, **CORS estrito**, **trustProxy** e **`vitek.platform.json`** (observability / issue dispatch).

#### 6.C.2 Personas e use cases

| Persona | Objetivo |
|---------|----------|
| **Integrador externo** | Chamar endpoints documentados com CORS e erros JSON consistentes |
| **SRE** | Ver request id e logs estruturados; correr `vitek doctor` no CI |
| **Equipa de produto** | Entender issue dispatch / buffer em dev (referência ao padrão `issue-dispatch`) |

#### 6.C.3 Features Vitek a demonstrar

| Feature | Nota |
|---------|------|
| `cors` como objeto | Origin explícito; alinhado a `CorsOptions` na doc |
| `maxBodySize` | Payload rejeitado com 413 |
| `onError` + `HttpError` | Diferença entre erro HTTP e bug não tratado |
| `trustProxy` | README explica quando usar atrás de reverse proxy |
| `beforeApiRequest` | Ex.: request id, timing, ou cabeçalho de versão |
| `vitek.config.mjs` em `dist` | Copiar ou gerar conforme guia de produção |
| `vitek.platform.json` | `observability` + `issueDispatch` com dispatcher em memória **simples** (não duplicar todo o `examples/issue-dispatch`, mas referenciar) |
| `withSpan` | Um handler “slow report” |

#### 6.C.4 Porque é diferente de A e B

- Menos “CRUD bonito”, mais **como operar e endurecer** uma API Vitek.
- Público-alvo: times que já aceitam file-based routes e querem **checklist de produção**.

#### 6.C.5 Ponteiros para `examples/`

- `examples/cors`, `examples/error-handling`, `examples/docker`
- `examples/observability`, `examples/issue-dispatch`, `examples/platform-doctor`

---

## 7. Matriz de cobertura (resumo)

| Área Vitek | OpsBoard (A) | StockPulse (B) | ReliableAPI (C) |
|------------|--------------|----------------|-----------------|
| Rotas + tipos + serviços | ●●● | ●● | ●● |
| OpenAPI | ●●● | ●● | ●● |
| AsyncAPI / WS | ○ / ● | ●●● | ○ |
| Middleware | ●● | ● | ●● |
| Validation / errors | ●● | ●● | ●●● |
| Plugin API | ● | ○ | ●●● |
| Contract CI | ●● | ○ | ●● |
| vitek-serve / prod | ●● | ●● | ●●● |
| Platform / observability | ○ | ○ | ●● |
| Prisma / DB | ○ (opcional) | ○ (opcional) | ○ |

Legenda: ●●● foco forte, ●● presente, ○ opcional ou ausente.

---

## 8. Fases de execução

### Fase 0 — Preparação (sem código de app)

- [x] Criar `showcases/README.md` com índice e critérios (pode extrair secções 2–3 deste plano).
- [x] Política de CI: showcases entram em `pnpm run check` e no workflow de PR via `showcases:build-and-test` (ver `showcases/README.md`).
- [x] Definir convenção de nome (`kebab-case`), Node/pnpm mínimos, e `file:../..` no monorepo (ver `showcases/README.md`).

### Fase 1 — Primeiro showcase (recomendado: **OpsBoard**)

- [x] Scaffold Vite + React + TS — ver [`showcases/ops-board` no GitHub](https://github.com/martinsbicudo/vitek-plugin/tree/main/showcases/ops-board).
- [x] Domínio mínimo + rotas + OpenAPI + testes de comportamento (`post-build.test.ts`).
- [x] README narrativo + links para guias e `examples/`.
- [x] Contract snapshot (`.vitek/contract/openapi.snapshot.json`) + `vitek contract check` no `pnpm test`.

### Fase 2 — Segundo showcase (**StockPulse** ou metade de **ReliableAPI**)

- [x] Escolhido **StockPulse** (inventário + WebSockets / AsyncAPI).
- [x] README + `post-build.test.ts` + snapshots OpenAPI e AsyncAPI em [`showcases/stock-pulse` no GitHub](https://github.com/martinsbicudo/vitek-plugin/tree/main/showcases/stock-pulse).

### Fase 3 — Terceiro showcase e scripts monorepo

- [x] Matriz fechada com **ReliableAPI** — [`showcases/reliable-api` no GitHub](https://github.com/martinsbicudo/vitek-plugin/tree/main/showcases/reliable-api).
- [x] `showcases/build-all.sh`, `showcases/run-all-tests.sh`, `showcases/build-and-test.sh` + scripts na raiz (`showcases:build`, `showcases:test`, `showcases:build-and-test`) e inclusão em `pnpm run check` e no workflow de PR.
- [x] Página **Showcases** no site — [`docs/showcases.md`](../docs/showcases.md) (VitePress: `/showcases`).

### Fase 4 — Polimento

- [x] Orientação para **screenshots / GIFs** nos README de cada showcase (capturas sugeridas; binários opcionais para não inflar o repo).
- [x] **Tour** na documentação do site — secção *Quick tour* em [`docs/showcases.md`](../docs/showcases.md).
- [x] **Bundle size** — secção no mesmo ficheiro + ligação a [`docs/guide/bundle-size.md`](../docs/guide/bundle-size.md) e comandos de verificação locais.

---

## 9. Critérios de aceitação (definição de pronto)

Um showcase é considerado **pronto** quando:

1. **README** contém: problema de negócio, quem usa, como correr em dev, como buildar, como servir em produção com `vitek-serve`, e links para guias oficiais + `examples/` relevantes.
2. **Código** usa convenções documentadas de naming de ficheiros em `src/api/`.
3. **Testes** validam pelo menos um fluxo crítico de forma não trivial (handler, bundle, ou contract).
4. **OpenAPI** gera spec utilizável (e AsyncAPI se houver sockets).
5. Não há secrets reais; credenciais são mock ou variáveis de exemplo.

---

## 10. Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Manutenção pesada | Poucos showcases; releases podem atualizar só um por vez. |
| Duplicação com `examples/` | README sempre com “Ver também `examples/X`”. |
| CI lento | Job separado ou `showcases:test` opcional no `check` principal. |
| Scope creep | Recusar novos showcases até os 2–3 primeiros estarem estáveis. |

---

## 11. Non-goals (explícito)

- Substituir ou fundir `examples/` com `showcases/`.
- Implementar autenticação enterprise (OAuth completo, multi-tenant) na v1 — mocks são suficientes.
- Hospedar showcases em produção pública obrigatória — o alvo é repo + docs.
- Garantir paridade com todos os `examples/` existentes num único showcase.

---

## 12. Referências internas

- Guias: `docs/guide/*.md`
- Índice atual de exemplos: `examples/README.md`
- Plano de showcases: este documento (alinhamento opcional com features de plataforma nos showcases)

---

*Documento de planeamento. Fases 0–4 concluídas no repo (Fase 4: tour + orientação de screenshots e bundle size na documentação; mídia binária continua opcional).*
