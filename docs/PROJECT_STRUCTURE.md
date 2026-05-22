# Project Structure

Este documento descreve a estrutura real encontrada no repositorio `terminal-ops-web`.

## Raiz

```text
.
|-- README.md
|-- docker-compose.yml
|-- api/
|-- web/
`-- docs/
```

Responsabilidades principais:

- `api/`: backend Node.js, TypeScript, Express, Prisma e PostgreSQL.
- `web/`: frontend React, Vite, TypeScript e TailwindCSS.
- `docker-compose.yml`: sobe PostgreSQL, API e web localmente.
- `docs/`: documentacao tecnica criada para orientar implementacoes futuras.

Documentos atuais:

- `PROJECT_STRUCTURE.md`: estrutura real e pontos de criacao.
- `BACKEND_GUIDE.md`: padroes backend.
- `FRONTEND_GUIDE.md`: padroes frontend.
- `DATABASE_GUIDE.md`: Prisma, migrations e banco.
- `API_GUIDE.md`: contratos REST, auth e OpenAPI.
- `FEATURE_IMPLEMENTATION_GUIDE.md`: passo a passo fullstack.
- `HARNESS_ENGINEERING_GUIDE.md`: verificacao, ambientes, gates e lacunas de testes/CI.
- `CODEX_CONTEXT.md`: resumo executivo para futuras etapas.

Pastas locais como `node_modules/`, `dist/` e `.vercel/` existem em `api/` e/ou `web/`, mas sao artefatos de ambiente/build e nao devem ser usadas como fonte de verdade para novas implementacoes.

## Backend

```text
api/
|-- package.json
|-- tsconfig.json
|-- Dockerfile
|-- vercel.json
|-- prisma.config.ts
|-- prisma/
|   |-- schema.prisma
|   |-- seed.ts
|   `-- migrations/
|       |-- 20260411150000_init/
|       |-- 20260521120000_add_nota_pesagem_id/
|       `-- migration_lock.toml
`-- src/
    |-- app.ts
    |-- server.ts
    |-- vercel.ts
    |-- config.ts
    |-- auth/
    |-- lib/
    |-- middlewares/
    |-- repositories/
    |-- routes/
    |-- services/
    |-- types/
    `-- validators/
```

### `api/src/app.ts`

Arquivo central de composicao do Express. Configura:

- `helmet`
- `cors`
- rate limit global
- `express.json({ limit: "100kb" })`
- HTTPS obrigatorio em producao
- `morgan`
- rota `/health`
- rotas `/api/docs`, `/api/auth`, `/api/ingest`, `/api/provision`, `/api/records`
- `notFoundHandler`
- `errorHandler`

Novas rotas devem ser registradas aqui depois de criadas em `api/src/routes`.

### `api/src/routes`

Onde ficam os routers Express.

Arquivos reais:

- `auth.routes.ts`: login e `/me`.
- `record.routes.ts`: listagem, criacao autenticada, importacao CSV e atualizacao de status por API key.
- `ingest.routes.ts`: ingestao direta por `x-api-key`.
- `provision.routes.ts`: criacao de usuario por `x-provision-key`.
- `docs.routes.ts`: OpenAPI JSON e Swagger UI.

Onde criar novas rotas: `api/src/routes/<feature>.routes.ts`.

### `api/src/services`

Camada de caso de uso/orquestracao.

Arquivos reais:

- `auth.service.ts`: autentica usuario e assina JWT.
- `record.service.ts`: cria/lista/atualiza registros e sanitiza saida.
- `user.service.ts`: cria usuario com hash bcrypt e evita expor `passwordHash`.

Onde criar novos services: `api/src/services/<feature>.service.ts`.

### `api/src/repositories`

Camada de acesso ao banco via Prisma.

Arquivos reais:

- `record.repository.ts`: `create`, `count`, `findMany`, `findFirst`, `update` em `Record`.
- `user.repository.ts`: busca usuario por email.

Onde criar novos repositories: `api/src/repositories/<feature>.repository.ts`.

### `api/src/validators`

Schemas Zod para body, query e params.

Arquivos reais:

- `auth.validator.ts`
- `record.validator.ts`
- `user.validator.ts`

Onde criar novos validators: `api/src/validators/<feature>.validator.ts`.

### `api/src/middlewares`

Middlewares compartilhados:

- `auth.ts`: valida JWT Bearer.
- `api-key.ts`: valida header `x-api-key`.
- `provision-key.ts`: valida header `x-provision-key`.
- `validate.ts`: aplica schemas Zod.
- `csrf-protection.ts`: valida `Origin`/`Referer` em metodos mutaveis.
- `enforce-https.ts`: exige HTTPS em producao.
- `error-handler.ts`: tratamento generico de erros.
- `not-found.ts`: resposta 404.

### `api/src/auth`

Contem utilitarios de JWT:

- `jwt.ts`: `signJwt` e `verifyJwt`.

### `api/src/lib`

Infra compartilhada:

- `prisma.ts`: instancia unica de `PrismaClient`.
- `rate-limit.ts`: geracao de chave de rate limit considerando proxy confiavel.

## Frontend

```text
web/
|-- package.json
|-- vite.config.ts
|-- vercel.json
|-- Dockerfile
|-- nginx.conf
|-- index.html
|-- public/
`-- src/
    |-- main.tsx
    |-- App.tsx
    |-- index.css
    |-- App.css
    |-- assets/
    |-- components/
    |-- hooks/
    |-- pages/
    |-- services/
    `-- types/
```

### `web/src/main.tsx`

Entrada React. Usa `StrictMode`, `BrowserRouter` e renderiza `App`.

### `web/src/App.tsx`

Registra rotas da SPA:

- `/login`: `LoginPage`
- `/`: `RecordsPage` protegida por `ProtectedRoute`
- `*`: redireciona para `/`

Tambem envolve a aplicacao com `AuthProvider`.

### `web/src/pages`

Onde ficam telas de pagina.

Arquivos reais:

- `LoginPage.tsx`
- `RecordsPage.tsx`

Onde criar novas paginas: `web/src/pages/<FeaturePage>.tsx`.

### `web/src/components`

Componentes reutilizaveis e componentes de tela.

Arquivos reais:

- `ProtectedRoute.tsx`
- `FiltersBar.tsx`
- `RecordsTable.tsx`
- `CsvUploadModal.tsx`

Onde criar componentes: `web/src/components/<ComponentName>.tsx`.

### `web/src/hooks`

Hooks/contextos React.

Arquivo real:

- `useAuth.tsx`: contexto de autenticacao, token em `localStorage`, validacao com `/auth/me`.

Onde criar hooks: `web/src/hooks/use<Feature>.tsx` ou `web/src/hooks/use<Thing>.ts`.

### `web/src/services`

Camada de chamadas HTTP.

Arquivos reais:

- `http.ts`: wrapper `fetch`, URL base e headers.
- `auth.service.ts`: login e `/me`.
- `records.service.ts`: listagem e upload CSV.

Onde criar services de frontend: `web/src/services/<feature>.service.ts`.

### `web/src/types`

Tipos TypeScript de contrato de API.

Arquivo real:

- `api.ts`: tipos de login, registros, filtros e resposta de CSV.

## Onde criar novos itens

- Nova rota backend: `api/src/routes/<feature>.routes.ts`, depois registrar em `api/src/app.ts`.
- Novo service backend: `api/src/services/<feature>.service.ts`.
- Novo repository backend: `api/src/repositories/<feature>.repository.ts`.
- Novo validator backend: `api/src/validators/<feature>.validator.ts`.
- Novo model Prisma: `api/prisma/schema.prisma`, depois migration em `api/prisma/migrations`.
- Nova pagina frontend: `web/src/pages/<FeaturePage>.tsx`, depois registrar rota em `web/src/App.tsx`.
- Novo componente frontend: `web/src/components/<ComponentName>.tsx`.
- Novo hook frontend: `web/src/hooks/use<Feature>.tsx` ou `.ts`.
- Novo service frontend: `web/src/services/<feature>.service.ts`.
- Novos tipos de API: `web/src/types/api.ts` ou arquivo especifico em `web/src/types`.
