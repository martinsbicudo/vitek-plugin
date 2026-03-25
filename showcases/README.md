# Vitek showcases

Aplicações **quase reais** que combinam várias capacidades do Vitek numa única narrativa (domínio, README com personas, produção com `vitek-serve`). Servem para **inspirar** e mostrar integração entre features; não substituem os micro-exemplos em [`examples/`](../examples/README.md).

**Plano detalhado (roadmap, fases, especificação de cada showcase):** [docs/SHOWCASES-PLAN.md](../docs/SHOWCASES-PLAN.md)

---

## Índice de showcases

| Slug | Nome | Estado |
|------|------|--------|
| [`ops-board`](./ops-board/) | OpsBoard — tarefas por equipa, UI + OpenAPI + middleware admin + contract | **disponível** |
| `stock-pulse` | StockPulse — inventário + WebSockets / AsyncAPI | não criado (Fase 2) |
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

**Decisão (Fase 0):** os showcases **não** entram no script `pnpm run check` da raiz do `vitek-plugin` até existirem scripts dedicados e acordo de manutenção.

| Momento | Comportamento |
|---------|----------------|
| **Agora** | Nenhum showcase listado no CI; pasta só contém este README até à Fase 1. |
| **Futuro (Fase 3 do plano)** | Introduzir `showcases/build-all.sh` e `showcases/test-all.sh` (ou `pnpm run showcases:test` na raiz) e, se desejado, um job GitHub Actions **separado** do workflow principal, para não alongar cada PR. |
| **Alternativa** | Incluir `showcases:test` no `check` apenas quando o número e o tempo de build forem aceitáveis. |

Quem mantém o repo pode correr showcases manualmente após `pnpm run build` na raiz, seguindo o README de cada projeto quando estes existirem.

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
