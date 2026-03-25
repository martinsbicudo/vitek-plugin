# Vitek showcases

Aplicações **quase reais** que combinam várias capacidades do Vitek numa única narrativa (domínio, README com personas, produção com `vitek-serve`). Servem para **inspirar** e mostrar integração entre features; não substituem os micro-exemplos em [`examples/`](../examples/README.md).

**Plano detalhado (roadmap, fases, especificação de cada showcase):** [docs/SHOWCASES-PLAN.md](../docs/SHOWCASES-PLAN.md)

---

## Índice de showcases

| Slug | Nome | Estado |
|------|------|--------|
| [`ops-board`](./ops-board/) | OpsBoard — tarefas por equipa, UI + OpenAPI + middleware admin + contract | **disponível** |
| [`stock-pulse`](./stock-pulse/) | StockPulse — inventário, movimentos REST, alertas WebSocket, OpenAPI + AsyncAPI + contract | **disponível** |
| `reliable-api` | ReliableAPI — CORS, limites, `onError`, plataforma | não criado (Fase 2–3) |

Quando existirem, cada pasta terá o seu próprio `README.md` com história, comandos e links para guias.

---

## `examples/` vs `showcases/`

| | `examples/` | `showcases/` |
|---|-------------|--------------|
| **Propósito** | Uma feature ou integração mínima | Vários pilares do Vitek na mesma app |
| **Tamanho** | Poucos ficheiros | Domínio mínimo viável, mais ficheiros |
| **Narrativa** | Bullets do que o repo demonstra | Personas, fluxos, decisões |
| **CI** | Rápido, parte do fluxo principal do plugin | Ver [Política de CI](#política-de-ci) |
| **Manutenção** | Muitas pastas pequenas | Poucos projetos “produto” |

**O que não duplicar aqui:** receitas já cobertas só em `examples/` (por exemplo `validation-only`, `cors`, `rate-limit`, `build-api-false`, `vite6-minimal`, `mcp-project`). Os showcases **apontam** para esses paths quando o leitor quiser um detalhe isolado.

---

## Princípios (todos os showcases)

1. **Domínio legível** — Negócio compreensível em poucos minutos.
2. **TypeScript por defeito** — Alinhado a tipos gerados, `api.services.ts` e OpenAPI.
3. **Frontend recomendado** em pelo menos um showcase — UI a consumir serviços gerados.
4. **Produção explícita** — `vite build` + `vitek-serve` (e notas de deploy quando fizer sentido).
5. **Segurança honesta** — CORS estrito, `maxBodySize`, `trustProxy` onde a história justificar; sem prometer enterprise auth completa na v1.
6. **Testes com comportamento** — Handlers, bundle ou contract; evitar só `existsSync(dist)`.
7. **Dependências contidas** — Sem filas cloud obrigatórias; DB opcional (ex. SQLite/Prisma).
8. **`vitek.platform.json`** — Só quando a narrativa precisar (observability, dispatch, etc.).

---

## Convenções do repositório

| Tópico | Decisão |
|--------|---------|
| **Nome das pastas** | `kebab-case` (ex.: `ops-board`, `stock-pulse`). |
| **Dependência `vitek-plugin` neste monorepo** | `"vitek-plugin": "file:../.."` em cada `package.json` do showcase, igual aos `examples/`. |
| **Fora do monorepo** | Usar a versão publicada no npm (`pnpm add vitek-plugin`) e seguir a [documentação](../docs/guide/installation.md). |
| **Vite** | Alinhar às peer dependencies do pacote: `vite` ^6 ou ^7 (ver `vitek-plugin/package.json` → `peerDependencies`). |
| **Node** | Compatível com as versões suportadas pelo Vite 6/7 e pelo ecossistema do repo (tipicamente Node atual LTS). |
| **Instalação isolada** | Ao testar um showcase à mão, usar `pnpm install --ignore-workspace` dentro da pasta do showcase quando estiveres no monorepo com workspace, para a cópia `file:../..` refletir o `dist/` atual do plugin (mesmo padrão descrito em [`examples/README.md`](../examples/README.md) para testes). |

---

## Política de CI

Na **raiz** do repositório:

| Script | O que faz |
|--------|-----------|
| `pnpm run showcases:build` | `pnpm i` + `build` em cada showcase listado em `showcases/build-all.sh`. |
| `pnpm run showcases:test` | `pnpm i` em cada showcase; `build` se `dist/` não existir; depois `pnpm test`. |
| `pnpm run showcases:build-and-test` | Compila o plugin na raiz, depois o mesmo ciclo completo que `examples/build-and-test.sh` (install + build + test por pasta). |

O `pnpm run check` da raiz inclui **`showcases:build-and-test`** a seguir a `examples:build-and-test`. O workflow **PR Tests Check** no GitHub Actions corre o mesmo passo de showcases no job `examples_check`.

Novos showcases: acrescentar o slug ao array `SHOWCASES` em `showcases/build-all.sh`, `showcases/run-all-tests.sh` e `showcases/build-and-test.sh` (igual à lista `EXAMPLES` nos scripts de `examples/`).

---

## Como desenvolver localmente (quando existir um showcase)

1. Na **raiz** do repositório `vitek-plugin`: `pnpm run build` (gera `dist/` do plugin).
2. `cd showcases/<slug>`
3. `pnpm install --ignore-workspace` (recomendado no monorepo) ou `pnpm install` conforme a tua configuração de workspace.
4. `pnpm run dev` / `pnpm run build` / `pnpm run start` conforme o `package.json` do showcase.

Detalhes variam por projeto; cada showcase documenta os seus scripts.

---

## Ligações

- [Plano completo e matriz de features](../docs/SHOWCASES-PLAN.md)
- [Índice de micro-exemplos](../examples/README.md)
- [Documentação Vitek](../docs/) · [site publicado](https://martinsbicudo.github.io/vitek-plugin/)
