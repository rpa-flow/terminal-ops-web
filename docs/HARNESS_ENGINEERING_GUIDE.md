# Harness Engineering Guide

Este documento avalia o projeto pelo ponto de vista de harness engineering: como preparar, executar, validar e evoluir mudancas com seguranca e repetibilidade.

## Estado atual

O projeto tem uma base operacional simples e util para desenvolvimento local:

- Docker Compose com PostgreSQL, API e web.
- Seed Prisma para usuario admin inicial.
- Health check em `GET /health`.
- Swagger/OpenAPI manual em `GET /api/docs` e `GET /api/docs/openapi.json`.
- Scripts de build para backend e frontend.
- Typecheck/lint no frontend.
- Validators Zod no backend, que funcionam como primeira linha de contrato.

Nao identificado no projeto atual:

- Testes automatizados de backend.
- Testes automatizados de frontend.
- Testes end-to-end.
- Fixtures dedicadas alem do seed de usuario admin.
- Pipeline CI/CD versionado no repositorio.
- Configuracao Harness CI/CD.
- Github Actions no repositorio raiz.
- Validacao automatica de contrato OpenAPI contra validators Zod.
- Ambiente de teste isolado com banco separado.
- Mocks/stubs para API no frontend.

## Harnesses existentes

### Local fullstack harness

Arquivo:

```text
docker-compose.yml
```

Servicos:

- `postgres`: PostgreSQL 16.
- `api`: backend em Node.js.
- `web`: frontend servido por Nginx.

Comando:

```bash
docker-compose up --build
```

URLs:

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000`
- Health: `http://localhost:4000/health`
- Swagger: `http://localhost:4000/api/docs`

Uso esperado:

- Validar fluxo completo login -> listagem -> filtros -> CSV.
- Validar ingestao tecnica com `x-api-key`.
- Validar provisionamento com `x-provision-key`.

### Backend build harness

Arquivo:

```text
api/package.json
```

Scripts reais:

```json
{
  "build": "tsc -p tsconfig.json",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate deploy",
  "prisma:seed": "tsx prisma/seed.ts"
}
```

Gate minimo atual para backend:

```bash
cd api
npm run build
```

Nao identificado no projeto atual:

- `npm test` no backend.
- `npm run lint` no backend.
- Script de test database reset.

### Frontend build/type/lint harness

Arquivo:

```text
web/package.json
```

Scripts reais:

```json
{
  "build": "tsc -b && vite build",
  "typecheck": "tsc -b",
  "lint": "eslint ."
}
```

Gate minimo atual para frontend:

```bash
cd web
npm run typecheck
npm run lint
npm run build
```

Nao identificado no projeto atual:

- Testes unitarios de componentes.
- Testes de interacao.
- Testes visuais.
- Playwright/Cypress.

### Database harness

Arquivos:

```text
api/prisma/schema.prisma
api/prisma/migrations/
api/prisma/seed.ts
```

Comandos:

```bash
cd api
npm run prisma:migrate
npm run prisma:seed
```

O seed cria/atualiza:

- `admin@admin.com`
- senha `123456`

Nao identificado no projeto atual:

- Seed de registros RPA.
- Fixtures CSV versionadas.
- Factories de dados para testes.
- Banco temporario por suite de teste.

## Matriz de verificacao por tipo de mudanca

### Mudanca so de documentacao

Gate recomendado:

- Conferir `git diff`.
- Conferir links/caminhos citados.
- Nao rodar build se nenhum codigo mudou.

### Mudanca backend sem banco

Gate minimo atual:

- `cd api && npm run build`
- Teste manual no endpoint alterado.
- Validar payload invalido para confirmar Zod.
- Conferir status codes esperados.
- Conferir que Swagger foi atualizado.

Gate ideal futuro:

- Teste unitario de validator/service.
- Teste de integracao HTTP com banco isolado.
- Verificacao automatica de OpenAPI.

### Mudanca backend com banco

Gate minimo atual:

- Criar migration.
- Aplicar migration em banco local.
- Rodar `npm run prisma:generate`.
- Rodar `npm run build`.
- Testar manualmente leitura/escrita afetada.
- Testar caso com banco vazio e caso com dados existentes quando houver backfill.

Gate ideal futuro:

- Banco PostgreSQL efemero para CI.
- Script de reset de banco de teste.
- Testes de repository/service.
- Fixture de dados minima por feature.

### Mudanca frontend sem contrato API

Gate minimo atual:

- `cd web && npm run typecheck`
- `cd web && npm run lint`
- `cd web && npm run build`
- Verificacao manual no navegador.
- Conferir loading/error/empty state.

Gate ideal futuro:

- Testes de componente.
- Teste de acessibilidade basico.
- Screenshot/visual regression quando houver tela critica.

### Mudanca fullstack

Gate minimo atual:

- Backend build.
- Frontend typecheck/lint/build.
- Docker Compose ou execucao local equivalente.
- Login com admin seed.
- Fluxo feliz da feature.
- Fluxo de validacao/erro.
- Conferir Swagger.

Gate ideal futuro:

- Teste E2E cobrindo a jornada principal.
- Teste API com banco isolado.
- Mock Service Worker ou equivalente para estados frontend.
- Contract test entre frontend types, OpenAPI e validators.

## Contratos que precisam ficar sincronizados

Ao alterar uma feature, conferir estes pontos juntos:

- `api/prisma/schema.prisma`
- `api/prisma/migrations/*/migration.sql`
- `api/src/validators/*.validator.ts`
- `api/src/repositories/*.repository.ts`
- `api/src/services/*.service.ts`
- `api/src/routes/*.routes.ts`
- `api/src/routes/docs.routes.ts`
- `web/src/types/api.ts`
- `web/src/services/*.service.ts`
- `web/src/pages/*.tsx`
- `web/src/components/*.tsx`

Ponto real ja identificado:

- `createRecordSchema` aceita `nota.pesagemId` como opcional.
- O OpenAPI atual de `RecordPayload` documenta `nota.pesagemId` como opcional.

Esse tipo de divergencia e exatamente o que um contract harness futuro deve capturar.

## Dados de teste e fixtures

### Existente

`api/prisma/seed.ts` cria o usuario admin inicial.

### Necessario para evolucao segura

Nao identificado no projeto atual:

- Fixture JSON para registro valido.
- Fixture JSON para registro invalido.
- CSV valido pequeno.
- CSV com linhas parcialmente invalidas.
- Dados para filtros de `status`, `motorista`, `placa`, `terminal` e intervalo de datas.

Sugestao futura de estrutura, se testes forem adicionados:

```text
api/test/fixtures/
|-- records.valid.json
|-- records.invalid.json
|-- records.valid.csv
`-- records.partial-errors.csv
```

No frontend:

```text
web/src/test/fixtures/
|-- records-response.json
`-- auth-response.json
```

Nao criar essas fixtures antes de definir a suite de testes; por enquanto o projeto nao tem harness automatizado que as consuma.

## Observabilidade de desenvolvimento

Existente:

- `morgan` no backend.
- `console.error(err)` no `errorHandler`.
- Prisma loga `warn` e `error`.
- Health check simples.

Nao identificado no projeto atual:

- Request id/correlation id.
- Logger estruturado.
- Metricas.
- Tracing.
- Logs de auditoria.

Para futuras features, manter logs sem:

- senha
- `passwordHash`
- JWT
- API keys
- secrets de ambiente
- payloads completos com dados sensiveis

## Pronto para implementar feature?

Sim, com ressalvas.

O projeto tem contexto suficiente para implementar features pequenas e medias com verificacao manual e builds. Para mudancas maiores, principalmente em banco, autenticacao ou contratos API/frontend, falta harness automatizado.

Checklist antes da proxima feature:

- Confirmar contrato atual no validator e no OpenAPI.
- Confirmar se a feature precisa de migration.
- Confirmar como testar manualmente o fluxo feliz e o fluxo de erro.
- Confirmar se a feature exige fixture ou seed adicional.
- Rodar gates disponiveis para a area alterada.
- Registrar qualquer lacuna com `Nao identificado no projeto atual.`

## Primeiro harness automatizado recomendado

Ordem recomendada, sem implementar agora:

1. Backend: adicionar teste de validators Zod de `record.validator.ts`.
2. Backend: adicionar teste HTTP de `POST /api/auth/login` e `GET /api/records` com banco de teste.
3. Frontend: adicionar teste de `http.ts`/services com fetch mockado.
4. Frontend: adicionar teste de `RecordsTable` para empty state e renderizacao basica.
5. E2E: adicionar Playwright para login e listagem.
6. CI: rodar backend build, frontend typecheck/lint/build e testes.

Nao identificado no projeto atual:

- Ferramenta escolhida para testes.
- Padrao de nome de arquivos de teste.
- Provedor CI.
- Politica de cobertura.

