# Codex Context

Resumo tecnico para futuras etapas de implementacao neste repositorio.

## Resumo executivo

`terminal-ops-web` e uma aplicacao fullstack para ingestao e visualizacao de registros de automacao RPA.

O backend expoe API Express segura com JWT, API keys, Zod, Prisma e Swagger manual. O frontend e uma SPA React/Vite com login, rota protegida, painel de registros, filtros, tabela e importacao CSV.

## Stack

Backend:

- Node.js
- TypeScript
- Express 5
- Prisma
- PostgreSQL
- Zod
- JWT com `jsonwebtoken`
- bcryptjs
- helmet, cors, express-rate-limit, morgan
- multer e csv-parse para CSV
- xss para sanitizacao de saida

Frontend:

- React 19
- Vite 8
- TypeScript
- React Router 7
- TailwindCSS 4
- fetch nativo via wrapper `http<T>`

Infra:

- Docker Compose local
- Vercel para API e frontend
- Nginx no container web

## Padroes reais do backend

- `api/src/app.ts` centraliza middlewares e registro de rotas.
- Rotas ficam em `api/src/routes`.
- Validators Zod ficam em `api/src/validators`.
- Services ficam em `api/src/services`.
- Repositories ficam em `api/src/repositories`.
- Prisma Client fica em `api/src/lib/prisma.ts`.
- JWT fica em `api/src/auth/jwt.ts`.
- Middlewares de auth ficam em `api/src/middlewares`.

Fluxo principal:

```text
route -> validate middleware -> service -> repository -> Prisma -> service sanitiza/organiza -> route responde JSON
```

Excecao identificada:

- `user.service.ts` acessa Prisma diretamente para criar usuario, em vez de usar `user.repository.ts`.

## Padroes reais do frontend

- `web/src/main.tsx` renderiza `App` dentro de `BrowserRouter`.
- `web/src/App.tsx` registra rotas e envolve tudo com `AuthProvider`.
- Paginas ficam em `web/src/pages`.
- Componentes ficam em `web/src/components`.
- Auth fica em `web/src/hooks/useAuth.tsx`.
- Services ficam em `web/src/services`.
- Tipos de API ficam em `web/src/types/api.ts`.
- Tailwind e classes globais ficam em `web/src/index.css`.

Fluxo de auth:

```text
LoginPage -> loginRequest -> setSession -> localStorage rpa_token -> ProtectedRoute -> meRequest
```

Fluxo de listagem:

```text
RecordsPage -> listRecordsRequest(token, filters) -> http<T> -> /api/records -> RecordsTable
```

## Decisoes arquiteturais importantes

- OpenAPI e manual, nao gerado automaticamente dos validators.
- Zod e a fronteira principal contra payload invalido e mass assignment.
- Prisma e usado para evitar SQL manual.
- JWT e enviado pelo frontend via header `Authorization`.
- API key e usada para ingestao tecnica.
- Provisionamento de usuarios usa chave separada `x-provision-key`.
- Frontend armazena JWT em `localStorage`.
- Nao ha biblioteca de componentes; visual e Tailwind direto com poucas classes globais.
- Nao ha camada dedicada de testes identificada no projeto atual.
- Harness atual e majoritariamente manual: Docker Compose, seed, health check, Swagger e scripts de build/type/lint.

## Cuidados de seguranca

- Manter `.strict()` em schemas Zod.
- Nunca passar payload externo nao validado para Prisma.
- Nao retornar `passwordHash`.
- Nao logar senha, token, API key, secrets ou headers completos.
- Usar `select` em queries de models com campos sensiveis.
- Usar `requireAuth` em endpoints de usuario autenticado.
- Usar `requireApiKey` ou `requireProvisionKey` em endpoints tecnicos.
- Atualizar CORS quando novo header customizado for consumido no browser.
- Considerar CSRF para rotas mutaveis sob `/api/records`.
- Evitar `dangerouslySetInnerHTML` no frontend.

## Checklist para implementar features

Backend:

- Ler rota/service/repository semelhante.
- Criar/alterar model Prisma se necessario.
- Criar migration nova.
- Criar validator Zod com `.strict()`.
- Criar repository usando Prisma Client compartilhado.
- Criar service com regra de uso e retorno seguro.
- Criar route com middlewares na ordem correta.
- Registrar route em `app.ts`.
- Atualizar `docs.routes.ts`.
- Rodar build/typecheck.

Frontend:

- Criar tipos de request/response.
- Criar service usando `http<T>`.
- Criar pagina com estados `loading`, `error`, dados e filtros.
- Criar componentes para formulario/tabela/modal quando necessario.
- Registrar rota em `App.tsx`.
- Usar `ProtectedRoute` quando exigir login.
- Usar classes visuais existentes.
- Testar estados vazio, erro, loading e sucesso.

Banco:

- Alterar `schema.prisma`.
- Criar migration.
- Conferir backfill para colunas obrigatorias.
- Adicionar indices/constraints necessarios.
- Rodar `prisma generate`.

Harness:

- Consultar `docs/HARNESS_ENGINEERING_GUIDE.md`.
- Declarar quais contratos mudaram.
- Rodar os gates disponiveis da area alterada.
- Testar manualmente fluxo feliz e pelo menos um fluxo de erro.
- Registrar lacunas quando nao houver teste automatizado.

## Pontos de atencao antes de alterar codigo

1. OpenAPI de `RecordPayload` parece nao documentar `nota.pesagemId`, embora o validator exija esse campo.
2. `web/src/App.css` parece ser resquicio do template e nao esta importado por `App.tsx`.
3. `user.service.ts` acessa Prisma diretamente, diferente do restante do padrao repository.
4. `X-Provision-Key` nao aparece nos `allowedHeaders` do CORS em `app.ts`.
5. JWT em `localStorage` exige cuidado adicional contra XSS.
6. Nao ha roles/permissoes identificadas, apenas usuario autenticado/API keys.
7. Nao ha soft delete identificado.
8. Auditoria e parcial: `User` tem `updatedAt`, `Record` nao.
9. Nao ha testes automatizados identificados.
10. Nao ha pipeline CI/CD ou configuracao Harness CI/CD identificada no repositorio raiz.

## Frases obrigatorias para lacunas

Quando um padrao pedido nao existir no projeto, documentar literalmente:

```text
Nao identificado no projeto atual.
```

Nao inventar padroes novos como se ja existissem.
