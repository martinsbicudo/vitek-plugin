# Plano de Melhorias — vitek-plugin

Documento de planejamento de melhorias técnicas e organizacionais do vitek-plugin, priorizado em fases.

---

## Fase 1 — Ganhos rápidos (curto prazo)

Objetivo: melhorar robustez e performance com esforço baixo.

### 1.1 Transform com Magic String

**Contexto:** O `transform` atual usa `code.replace()` para reescrever imports relativos. Regex em código fonte pode atingir strings literais, comentários ou casos edge.

**Use cases:**
- UC-1.1.1: Arquivo em `src/api/health.get.ts` importa `../lib/utils` → reescrito para `/src/lib/utils` sem alterar outras linhas
- UC-1.1.2: Arquivo com múltiplos imports relativos → cada import editado isoladamente, preservando posições
- UC-1.1.3: Arquivo sem imports relativos → retorna `null` sem criar Magic String
- UC-1.1.4: Source map gerado para edições permite debug correto

**Ação:**
- Adicionar `magic-string` como dependência
- Substituir `code.replace()` por edições cirúrgicas com Magic String
- Usar `s.overwrite()` apenas nos trechos de import alvo
- Preservar source maps quando possível (`map: s.generateMap({ hires: 'boundary' })`)

**Benefício:** Edições mais seguras, menor risco de alterar código indevidamente.

---

### 1.2 Filtros nos hooks do Vite

**Contexto:** `transform` e `resolveId` são chamados para muitos módulos; hoje a seleção é feita dentro do handler retornando `null`.

**Use cases:**
- UC-1.2.1: Request para `node_modules/vue/dist/vue.js` → handler do transform não é chamado (filter exclui)
- UC-1.2.2: Request para `src/api/health.get.ts` → handler é chamado (filter inclui .ts)
- UC-1.2.3: Request para `public/logo.png` → handler não é chamado (extensão excluída)
- UC-1.2.4: `resolveId` com id `vue` → early return, não processa (id não começa com `./` ou `../`)

**Ação:**
- Usar API de filtro quando disponível: `transform: { filter: { id, exclude }, handler }`
- Filtrar por extensão (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`) e excluir `node_modules`
- Manter `resolveId` focando em ids que começam com `./` ou `../`

**Benefício:** Menos processamento desnecessário e melhor performance.

---

### 1.3 Documentação de imports relativos

**Contexto:** `resolveId` e `transform` tratam imports relativos em arquivos da API; isso pode não estar claro para quem usa o plugin.

**Use cases:**
- UC-1.3.1: Dev cria `src/api/users/[id].get.ts` e quer importar `../../lib/db` → documentação explica que funciona
- UC-1.3.2: Dev tenta `import x from '../../../etc/passwd'` → documentação explica que não é reescrito (fora do root)
- UC-1.3.3: Dev quer saber estrutura recomendada → documentação mostra exemplo `src/api`, `src/lib`, `src/shared`
- UC-1.3.4: Dev tem projeto com `api/` na raiz → documentação explica `apiDir` e limites

**Ação:**
- Adicionar seção na documentação explicando:
  - Import de arquivos fora de `apiDir` (ex.: `../lib/...`, `../../shared/...`)
  - Limitações (ex.: só dentro do projeto)
  - Exemplo com estrutura recomendada

**Benefício:** Menos confusão e issues relacionadas a imports.

---

### 1.4 Tratamento de erros na geração

**Contexto:** Em `buildStart` e `runFileGeneration`, erros são logados mas não expostos de forma consistente.

**Use cases:**
- UC-1.4.1: `buildStart` falha ao gerar types (ex.: erro de sintaxe em rota) → log + `onGenerationError` chamado; build continua ou falha com mensagem clara
- UC-1.4.2: Dev server reload falha ao gerar types → log + callback; rotas continuam funcionando
- UC-1.4.3: Usuário configura `onGenerationError: (err) => sentry.captureException(err)` → erros reportados
- UC-1.4.4: OpenAPI generation falha → mensagem clara, não quebra geração de types/services

**Ação:**
- Padronizar tratamento: log + callback ou evento opcional
- Garantir que falhas na geração não derrubem o build sem mensagem clara
- Opcional: expor `onGenerationError` nas opções do plugin

**Benefício:** Debug mais fácil e feedback melhor para o usuário.

---

## Fase 2 — Organização e qualidade (médio prazo) ✅

Objetivo: melhorar estrutura do código e qualidade dos testes.

**Status:** Concluída. Sub-plugins (`vitek:resolve`, `vitek:transform`, `vitek:dev`, `vitek:preview`, `vitek:build`), path-utils, srcDir, documentação e testes adicionados.

### 2.1 Modularização do plugin principal

**Contexto:** `plugin.ts` concentra config, resolve, transform, dev, preview e build em um único arquivo.

**Ação:**
- Dividir em sub-plugins com responsabilidades claras:
  - `vitek:resolve` — `resolveId` para imports relativos em arquivos da API
  - `vitek:transform` — reescrita de imports relativos para root-relative
  - `vitek:dev` — `configureServer`, middleware, watcher
  - `vitek:preview` — `configurePreviewServer`, carregamento do bundle
  - `vitek:build` — `buildStart`, `closeBundle`, geração e bundles
- Exportar um array de plugins ou um plugin agregador que retorne `[...]`
- Manter `enforce: 'pre'` onde necessário

**Benefício:** Manutenção, testes unitários e depuração mais simples.

---

### 2.2 Unificação da lógica de normalização de paths

**Contexto:** `resolveId` e `transform` repetem lógica para normalizar `importer`/`id` (file:, /, path absoluto).

**Ação:**
- Extrair funções utilitárias: `normalizeImporter(importer, root)`, `normalizeModuleId(id, root)`
- Centralizar em `shared/` ou `adapters/vite/path-utils.ts`
- Reutilizar em ambos os hooks

**Benefício:** DRY, menos bugs e comportamento consistente.

---

### 2.3 Aumento da cobertura de testes

**Contexto:** Coverage em torno de 45%; `dev-server`, `build`, `plugin` hooks e outros módulos têm pouca ou nenhuma cobertura.

**Ação:**
- Testar hooks do plugin com mocks (Vite config, server, etc.)
- Testar `dev-server` com `ssrLoadModule` mockado
- Testar fluxos de `build-api-bundle` e `build-sockets-bundle` com dir temporário
- Ajustar ou documentar thresholds de coverage conforme prioridades

**Benefício:** Menos regressões e refactors mais seguros.

---

### 2.4 Opção de `srcDir` configurável

**Contexto:** `transform` assume `src/` como diretório de source; projetos podem usar outra estrutura.

**Ação:**
- Adicionar opção `srcDir?: string` (default: `'src'`)
- Usar em `transform` para decidir se o arquivo deve ser processado
- Documentar na API e nos exemplos

**Benefício:** Maior flexibilidade para projetos com estrutura diferente.

---

## Fase 3 — Evolução e extensibilidade (longo prazo)

Objetivo: preparar o plugin para mais cenários e integrações.

### 3.1 Sistema de plugins / hooks extensíveis

**Contexto:** Hoje a extensão do vitek depende de modificar o plugin ou do Vite.

**Ação:**
- Definir hooks internos: `beforeRouteLoad`, `afterTypesGenerated`, `beforeApiRequest`, etc.
- Permitir plugins externos registrarem callbacks via opção `plugins: [...]`
- Documentar API de extensão

**Benefício:** Comunidade e integrações (ex.: ORMs, auth) sem alterar o core.

---

### 3.2 Otimizações de build

**Contexto:** O bundle da API é gerado com esbuild; há espaço para otimizações.

**Ação:**
- Avaliar `optimizeDeps.exclude: ['vitek-plugin']` em projetos que usam o plugin
- Considerar minificação e tree-shaking específicos para o bundle da API
- Medir impacto de `external` e de inclusões desnecessárias

**Benefício:** Bundles menores e builds mais rápidos.

---

### 3.3 Resolve via alias (alternativa ao transform)

**Contexto:** Parte da resolução de imports poderia ser feita via alias em vez de reescrita de código.

**Ação:**
- Avaliar se `resolve.alias` pode cobrir cenários simples (ex.: alias `@lib` → `src/lib`)
- Manter `transform` para casos que dependam de paths relativos dinâmicos
- Documentar quando usar alias vs estrutura padrão

**Benefício:** Menos transform e possível simplificação da pipeline.

---

### 3.4 Metadados e introspection

**Contexto:** Outras ferramentas (CLI, IDEs) podem querer inspecionar rotas e sockets.

**Ação:**
- Expor API programática: `getRoutes(root, apiDir)`, `getSockets(root, apiDir)`
- Gerar artefato (ex.: `vitek-manifest.json`) com rotas, métodos e metadados
- Documentar formato e casos de uso

**Benefício:** Integração com outras ferramentas e automações.

---

### 3.5 Suporte a Vite 6+

**Contexto:** Atualmente o plugin tem peer dependency em Vite ^5.0.0.

**Ação:**
- Acompanhar mudanças na API do Vite 6
- Ajustar hooks (ObjectHook, filtros, etc.) conforme necessário
- Garantir compatibilidade com Vite 5 e 6 durante transição

**Benefício:** Manter o plugin atualizado com novas versões do Vite.

---

## Resumo por fase

| Fase | Itens | Foco principal |
|------|-------|----------------|
| **1** | 1.1–1.4 | Robustez, performance e documentação |
| **2** | 2.1–2.4 | Organização, testes e flexibilidade |
| **3** | 3.1–3.5 | Extensibilidade e evolução |

---

## Critérios de conclusão por fase

- **Fase 1:** Itens implementados, testados e documentados; sem regressões visíveis nos exemplos.
- **Fase 2:** Plugin modularizado; cobertura de testes aumentada; `srcDir` opcional em produção.
- **Fase 3:** API de extensão definida e documentada; suporte a Vite 6 validado; manifest/introspection disponível.

---

*Documento criado em fev/2025. Atualizar conforme prioridades e descobertas do projeto.*
