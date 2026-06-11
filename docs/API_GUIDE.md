# API Guide

API REST em Express, documentada manualmente com OpenAPI em `api/src/routes/docs.routes.ts`.

## Base e endpoints

Local:

- API: `http://localhost:4000`
- Frontend via Vite proxy: chamadas para `/api`

Endpoints reais:

- `GET /health`
- `GET /api/docs`
- `GET /api/docs/openapi.json`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/ingest/records`
- `POST /api/ingest/records/:numeroNota/status`
- `PATCH /api/ingest/records/:numeroNota/status`
- `POST /api/provision/users`
- `GET /api/records`
- `POST /api/records`
- `POST /api/records/csv`
- `POST /api/records/:numeroNota/status`
- `PATCH /api/records/:numeroNota/status`

## Padrao REST identificado

- Nomes de recursos no plural: `/records`, `/users`.
- Login em `/auth/login`.
- Usuario atual em `/auth/me`.
- Ingestao tecnica separada em `/ingest/records`.
- Provisionamento separado em `/provision/users`.
- Atualizacao de status como sub-recurso: `/:numeroNota/status`.

Nao identificado no projeto atual:

- Versionamento de API como `/api/v1`.
- Convencao HAL/JSON:API.
- DELETE endpoints.
- PUT endpoints.

## Request e response

Formato de request:

- JSON para a maioria dos endpoints.
- `multipart/form-data` para `/api/records/csv`.
- Query string para filtros de listagem.

Formato de response:

- JSON simples.
- Erros conhecidos usam `{ "message": "..." }`.
- Validacao usa `{ "message": "Invalid request payload", "details": [...] }`.
- Lista paginada usa `page`, `perPage`, `total`, `items`.

Exemplo real de listagem:

```json
{
  "page": 1,
  "perPage": 20,
  "total": 1,
  "items": []
}
```

Exemplo real de erro de validacao:

```json
{
  "message": "Invalid request payload",
  "details": [
    { "path": "email", "message": "Invalid email address" }
  ]
}
```

## Paginacao e filtros

Endpoint:

```text
GET /api/records
```

Query params reais:

- `page`: inteiro, minimo `1`, default `1`.
- `perPage`: inteiro, minimo `1`, maximo `100`, default `20`.
- `startDate`: data opcional.
- `endDate`: data opcional.
- `status`: string opcional.
- `motorista`: string opcional.
- `placa`: string opcional, transformada para uppercase.
- `terminal`: string opcional.

Repository:

- Usa `count` e `findMany` em `prisma.$transaction`.
- Usa `skip = (page - 1) * perPage`.
- Usa `take = perPage`.
- Ordena por `dataHora desc`.

Filtros Prisma:

- `status`: `equals` com `mode: "insensitive"`.
- `motorista`, `placa`, `terminal`: `contains` com `mode: "insensitive"`.
- `dataHora`: `gte`/`lte`.

## Status codes

Status codes reais:

- `200`: login, `/me`, listagem, atualizacao de status.
- `201`: criacao de registro, ingestao, criacao de usuario.
- `207`: processamento CSV com sucesso parcial ou total.
- `400`: validacao invalida, CSV invalido/vazio/excedente, HTTPS ausente em producao.
- `401`: credenciais invalidas, JWT ausente/invalido, API key invalida.
- `403`: CSRF/origin/referer invalido.
- `404`: recurso/rota nao encontrado ou registro nao encontrado em atualizacao de status.
- `409`: email ja em uso.
- `500`: erro inesperado.

## Autenticacao com JWT

Endpoints protegidos por JWT:

- `GET /api/auth/me`
- `GET /api/records`
- `POST /api/records`
- `POST /api/records/csv`

Header:

```text
Authorization: Bearer <token>
```

Middleware:

- `requireAuth` valida Bearer token.
- Em sucesso popula `req.auth`.
- Em falha responde `401`.

Login:

```text
POST /api/auth/login
```

Payload:

```json
{
  "email": "admin@admin.com",
  "password": "123456"
}
```

Response:

```json
{
  "token": "...",
  "user": {
    "id": "...",
    "email": "admin@admin.com"
  }
}
```

## Protecao com API key

Ingest API key:

- Middleware: `requireApiKey`.
- Header: `x-api-key`.
- Valor esperado: `env.INGEST_API_KEY`.

Endpoints:

- `POST /api/ingest/records`
- `POST /api/ingest/records/:numeroNota/status`
- `PATCH /api/ingest/records/:numeroNota/status`
- `POST /api/records/:numeroNota/status`
- `PATCH /api/records/:numeroNota/status`

Provision key:

- Middleware: `requireProvisionKey`.
- Header: `x-provision-key`.
- Valor esperado: `env.PROVISION_SECRET`.

Endpoint:

- `POST /api/provision/users`

Nao identificado no projeto atual:

- Rotacao de API keys.
- API keys por cliente.
- Escopos/permissoes por API key.

## Swagger/OpenAPI

OpenAPI e gerado manualmente em `docs.routes.ts`.

Security schemes reais:

- `bearerAuth`
- `ingestApiKey`
- `provisionApiKey`

Swagger UI:

```text
GET /api/docs
```

OpenAPI JSON:

```text
GET /api/docs/openapi.json
```

Ao criar endpoint:

1. Adicionar schemas em `components.schemas`, se necessario.
2. Adicionar security scheme se for novo tipo de auth.
3. Adicionar path e method.
4. Documentar requestBody, parameters e responses.
5. Manter exemplos coerentes com validators Zod.

Ponto de atencao real:

- O schema OpenAPI `RecordPayload` documenta `nota.pesagemId` como campo opcional.

## Contratos atuais de registro

Validator de criacao espera payload externo com `nota.pesagemId` opcional:

```json
{
  "dataHora": "2026-04-11 14:32:00",
  "nota": {
    "numero": "12345",
    "original": "VALOR ORIGINAL",
    "pesagemId": "PES-123",
    "status": "PROCESSADO"
  },
  "motorista": {
    "nome": "Joao",
    "celular": "31999999999"
  },
  "veiculo": {
    "placa": "ABC1234"
  },
  "terminal": "Terminal 1"
}
```

DTO interno gravado via Prisma:

```ts
{
  dataHora,
  numeroNota,
  notaOriginal,
  status,
  notaPesagemId,
  motoristaNome,
  motoristaCelular,
  placa,
  terminal
}
```

## CORS e CSRF

CORS:

- Origem permitida vem de `env.CORS_ORIGIN`.
- Metodos permitidos em `app.ts`: `GET`, `POST`, `PATCH`.
- Headers permitidos em `app.ts`: `Content-Type`, `Authorization`, `X-API-Key`.

CSRF:

- `csrfProtection` protege `/api/records`.
- Valida `Origin` e `Referer` para `POST`, `PUT`, `PATCH`, `DELETE`.
- Usa a mesma whitelist de `CORS_ORIGIN`.

Ponto de atencao:

- `X-Provision-Key` nao aparece nos `allowedHeaders` do CORS atual.
- Rotas `/api/records/:numeroNota/status` tambem passam por `csrfProtection` por estarem sob `/api/records`.

