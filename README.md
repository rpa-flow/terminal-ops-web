# RPA Ops Platform (Secure)

Aplicacao fullstack para ingestao e visualizacao de dados de automacao RPA com foco em seguranca.

## Stack

- Backend: Node.js + TypeScript + Express + Prisma
- Frontend: React + Vite + TypeScript + TailwindCSS
- Banco: PostgreSQL
- Infra local: Docker Compose
- Deploy cloud: Vercel (API e Frontend)

## Estrutura

- api/src/routes
- api/src/services
- api/src/repositories
- api/src/middlewares
- api/src/auth
- api/src/validators
- web/src/pages
- web/src/components
- web/src/hooks
- web/src/services

## Seguranca Implementada

- SQL Injection: Prisma ORM, sem concatenacao SQL
- Command Injection: nenhum uso de execucao de comandos via input
- XSS: validacao rigorosa + sanitizacao de saida no backend
- CSRF: validacao de Origin/Referer para metodos mutaveis
- Mass Assignment: schemas Zod strict, somente campos permitidos
- Validacao de entrada: Zod em body/query
- Auth: JWT com expiracao + senha hash com bcrypt
- Headers: Helmet
- CORS: whitelist por ambiente
- HTTPS: obrigatorio em producao
- Rate limit: global + login
- Logs: sem dados sensiveis

## Credencial Inicial

- email: admin@admin.com
- senha: 123456

## Rodar com Docker

```bash
docker-compose up --build
```

Acessos:
- Frontend: http://localhost:5173
- API: http://localhost:4000

Importante (ambiente local com Docker):
- Use HTTP nas chamadas locais (`http://localhost:4000`).
- Nao use HTTPS local (`https://localhost:4000`), pois isso pode gerar o erro `WRONG_VERSION_NUMBER`.

## Rodar sem Docker

### Backend

```bash
cd api
cp .env.example .env
npm install
npx prisma generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

### Frontend

```bash
cd web
cp .env.example .env
npm install
npm run dev
```

## API

### Login

`POST /api/auth/login`

Payload:

```json
{
  "email": "admin@admin.com",
  "password": "123456"
}
```

### Criar registro

`POST /api/records`

Headers:
- Authorization: Bearer <token>

Payload:

```json
{
  "dataHora": "2026-04-11 14:32:00",
  "nota": {
    "numero": "12345",
    "original": "VALOR ORIGINAL",
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

### Ingestao direta (sem login de usuario)

`POST /api/ingest/records`

Headers:
- `x-api-key: <INGEST_API_KEY>`
- `Content-Type: application/json`

Payload:

```json
{
  "dataHora": "2026-04-11 14:32:00",
  "nota": {
    "numero": "12345",
    "original": "VALOR ORIGINAL",
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

Exemplo curl:

```bash
curl -X POST http://localhost:4000/api/ingest/records \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-ingest-key-change-in-production" \
  -d '{
    "dataHora": "2026-04-11 14:32:00",
    "nota": {"numero":"12345","original":"VALOR ORIGINAL","status":"PROCESSADO"},
    "motorista": {"nome":"Joao","celular":"31999999999"},
    "veiculo": {"placa":"ABC1234"},
    "terminal":"Terminal 1"
  }'
```

Exemplo PowerShell:

```powershell
$body = @{
  dataHora = "2026-04-11 14:32:00"
  nota = @{ numero = "12345"; original = "VALOR ORIGINAL"; status = "PROCESSADO" }
  motorista = @{ nome = "Joao"; celular = "31999999999" }
  veiculo = @{ placa = "ABC1234" }
  terminal = "Terminal 1"
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/ingest/records" `
  -Headers @{ "x-api-key" = "dev-ingest-key-change-in-production" } `
  -ContentType "application/json" -Body $body
```

### Provisionar usuario (rota protegida por chave)

`POST /api/provision/users`

Headers:
- `x-provision-key: <PROVISION_SECRET>`
- `Content-Type: application/json`

Exemplo curl:

```bash
curl -X POST http://localhost:4000/api/provision/users \
  -H "Content-Type: application/json" \
  -H "x-provision-key: change-this-to-a-long-random-provision-secret-32chars" \
  -d '{"email":"novo@example.com","password":"suasenha123"}'
```

Exemplo PowerShell:

```powershell
$body = @{
  email = "novo@example.com"
  password = "suasenha123"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/provision/users" `
  -Headers @{ "x-provision-key" = "change-this-to-a-long-random-provision-secret-32chars" } `
  -ContentType "application/json" -Body $body
```

### Listar registros

`GET /api/records?page=1&perPage=20&startDate=2026-04-11T00:00&endDate=2026-04-11T23:59&status=PROCESSADO&motorista=Joao&placa=ABC1234&terminal=Terminal%201`

## Deploy no Vercel

### Backend (`/api`)

1. Importe a pasta `api` como projeto no Vercel.
2. O `vercel.json` da API ja aponta todas as rotas para `src/vercel.ts`.
3. Configure variaveis de ambiente:
   - `NODE_ENV=production`
   - `DATABASE_URL=<postgres gerenciado>`
   - `JWT_SECRET=<segredo longo>`
   - `JWT_EXPIRES_IN=1h`
  - `INGEST_API_KEY=<chave longa de ingestao>`
   - `CORS_ORIGIN=<url do frontend no vercel>`
   - `TRUST_PROXY=1`
4. Execute migracao e seed no banco de producao antes de liberar trafego:
   - `npx prisma migrate deploy`
   - `npm run prisma:seed`

### Frontend (`/web`)

1. Importe a pasta `web` como projeto no Vercel.
2. Configure `VITE_API_BASE_URL` com a URL da API, por exemplo:
   - `https://seu-backend.vercel.app/api`
3. O `vercel.json` do frontend ja faz rewrite para `index.html` (SPA).

## Observacoes de Producao

- Em producao use banco gerenciado com TLS.
- Em producao, use HTTPS fim a fim e segredo JWT forte.
- Nao exponha `.env` no repositorio.
