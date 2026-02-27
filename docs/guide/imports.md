# Imports relativos

O vitek-plugin trata automaticamente imports relativos (`./` e `../`) em arquivos dentro de `src/`, permitindo que rotas e sockets importem código compartilhado fora do diretório da API.

## Como funciona

Arquivos em `src/api/` (e qualquer arquivo em `src/`) podem importar módulos relativos que estejam **dentro da raiz do projeto**. O plugin:

1. **resolveId** — resolve imports relativos em arquivos da API para o caminho absoluto correto (incluindo fallback de extensão `.ts`, `.js`, etc.).
2. **transform** — reescreve imports relativos em arquivos em `src/` para caminhos root-relative (`/src/lib/...`) para que o Vite os resolva corretamente no dev e no build.

## Estrutura recomendada

```
src/
  ├── api/                    # Rotas (apiDir padrão)
  │   ├── health.get.ts
  │   ├── users/
  │   │   └── [id].get.ts
  │   └── posts/
  │       └── index.post.ts
  ├── lib/                    # Utilitários compartilhados
  │   ├── db.ts
  │   └── auth.ts
  └── shared/                 # Código compartilhado entre api e frontend
      └── types.ts
```

## Exemplos

### Import de lib dentro do projeto

**src/api/users/[id].get.ts:**
```ts
import { getUser } from '../../lib/db';
import type { User } from '../../shared/types';

export default async function handler(ctx) {
  const user = await getUser(ctx.params.id);
  return user ?? null;
}
```

O import `../../lib/db` é reescrito para `/src/lib/db` e resolvido corretamente.

### Import aninhado

**src/api/posts/[id]/comments.get.ts:**
```ts
import { getComments } from '../../../lib/comments';
```

O import `../../../lib/comments` também é tratado, desde que o arquivo resolvido esteja dentro da raiz do projeto.

## Limitações

- **Somente dentro do projeto** — Imports que resolvem para fora da raiz (ex.: `../../../etc/passwd`) **não** são reescritos por razões de segurança.
- **Apenas arquivos em `src/` (ou `srcDir`)** — O transform aplica-se apenas a arquivos sob o diretório de source (padrão: `src/`). Use a opção `srcDir` se seu código ficar em outro diretório (ex.: `lib/` ou `app/`). Arquivos em `public/`, `node_modules/` ou fora de `srcDir` não são processados.
- **Imports relativos apenas** — Imports de pacotes npm (ex.: `import vue from 'vue'`) passam direto; não são alterados.
- **apiDir configurável** — Se você usar `apiDir` fora de `src/` (ex.: `api/` na raiz), o `resolveId` ainda ajuda imports em arquivos da API; o `transform` continua aplicando-se a arquivos em `src/` (onde normalmente ficam as rotas).

## apiDir e srcDir personalizados

Quando `apiDir` é configurado (ex.: `apiDir: 'api'` com `api/` na raiz), o `resolveId` continua funcionando para imports relativos **dentro** dos arquivos da API.

Use `srcDir` quando seu código-fonte estiver em outro diretório (ex.: `srcDir: 'lib'`). O transform aplica-se a todos os arquivos sob `srcDir`, reescrevendo imports relativos para paths root-relative.

## Troubleshooting

**Import não está sendo resolvido:**
- Verifique se o caminho relativo está correto e se o arquivo existe.
- Confirme que o alvo do import está dentro da raiz do projeto.
- Em dev, o Vite pode cachear; tente reiniciar o servidor.

**Build falha com "module not found":**
- O esbuild do bundle da API usa os caminhos já reescritos. Garanta que todos os imports relativos apontem para arquivos existentes no projeto.
