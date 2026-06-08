# Database Guide

Banco PostgreSQL com Prisma.

## Configuracao Prisma

Arquivos reais:

- `api/prisma.config.ts`
- `api/prisma/schema.prisma`
- `api/prisma/migrations`
- `api/prisma/seed.ts`
- `api/src/lib/prisma.ts`

`api/prisma.config.ts`:

```ts
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

`api/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Cliente Prisma:

```ts
export const prisma = new PrismaClient({
  log: ["warn", "error"]
});
```

## Models atuais

### `User`

Tabela mapeada para `users`.

Campos:

- `id`: UUID, primary key.
- `email`: unico, `VarChar(254)`.
- `passwordHash`: mapeado para `password_hash`.
- `createdAt`: mapeado para `created_at`.
- `updatedAt`: mapeado para `updated_at`, atualizado automaticamente.

Constraints:

- `email` unico.

### `Record`

Tabela mapeada para `records`.

Campos:

- `id`: UUID, primary key.
- `dataHora`: mapeado para `data_hora`.
- `numeroNota`: mapeado para `numero_nota`.
- `notaOriginal`: mapeado para `nota_original`.
- `notaPesagemId`: mapeado para `nota_pesagem_id`.
- `status`
- `motoristaNome`: mapeado para `motorista_nome`.
- `motoristaCelular`: mapeado para `motorista_celular`.
- `placa`
- `terminal`
- `createdAt`: mapeado para `created_at`.

Indices atuais:

```prisma
@@index([dataHora])
@@index([status])
@@index([motoristaNome])
@@index([placa])
@@index([terminal])
```

## Migrations

Migrations reais:

```text
api/prisma/migrations/
|-- 20260411150000_init/
|   `-- migration.sql
|-- 20260521120000_add_nota_pesagem_id/
|   `-- migration.sql
`-- migration_lock.toml
```

`20260411150000_init`:

- Cria extensao `pgcrypto`.
- Cria tabelas `users` e `records`.
- Cria indices de records.

`20260521120000_add_nota_pesagem_id`:

- Adiciona coluna `nota_pesagem_id`.
- Preenche registros existentes com `numero_nota`.
- Remove default temporario.

## Scripts existentes

Em `api/package.json`:

```json
{
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate deploy",
  "prisma:seed": "tsx prisma/seed.ts",
  "postinstall": "prisma generate"
}
```

Importante:

- `npm run prisma:migrate` usa `prisma migrate deploy`, adequado para aplicar migrations existentes.
- Nao ha script dedicado para `prisma migrate dev`.
- Nao ha script dedicado para `prisma studio`.

## Como criar novos models

1. Editar `api/prisma/schema.prisma`.
2. Usar tipos explicitos e mapeamentos coerentes com o banco, como `@map` e `@@map`.
3. Adicionar indices com `@@index` quando houver filtro/ordenacao frequente.
4. Adicionar constraints com `@unique`, `@@unique` ou relacoes conforme necessidade real.
5. Criar migration.
6. Gerar Prisma Client.
7. Criar repository/service/validator que use o novo model.

Exemplo de estilo atual:

```prisma
model Record {
  id         String   @id @default(uuid()) @db.Uuid
  dataHora   DateTime @map("data_hora") @db.Timestamp(3)
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([dataHora])
  @@map("records")
}
```

## Como criar migrations

Para desenvolvimento local, o comando Prisma padrao e:

```bash
cd api
npx prisma migrate dev --name nome_da_migration
```

Depois:

```bash
npm run prisma:generate
```

Para aplicar migrations existentes no ambiente local ou deploy:

```bash
cd api
npm run prisma:migrate
```

Para seed:

```bash
cd api
npm run prisma:seed
```

## Banco local

`docker-compose.yml` define PostgreSQL:

```yaml
POSTGRES_USER: postgres
POSTGRES_PASSWORD: postgres
POSTGRES_DB: rpa_db
```

API no Docker usa:

```text
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/rpa_db?schema=public
DIRECT_URL=postgresql://postgres:postgres@postgres:5432/rpa_db?schema=public
```

## Indices e constraints

Padrao atual:

- Indices declarados no Prisma para campos filtraveis.
- Unique de email no model `User`.
- UUID primary key via `@default(uuid())`.

Ao adicionar indice:

```prisma
@@index([campo])
```

Ao adicionar constraint unica:

```prisma
campo String @unique
```

ou:

```prisma
@@unique([campoA, campoB])
```

## Soft delete

Nao identificado no projeto atual.

Nao existem campos como `deletedAt`, `isDeleted` ou filtros globais de exclusao logica.

## Auditoria

Parcialmente identificado:

- `User` tem `createdAt` e `updatedAt`.
- `Record` tem `createdAt`, mas nao tem `updatedAt`.

Nao identificado no projeto atual:

- `createdBy`
- `updatedBy`
- `deletedBy`
- trilha de auditoria em tabela separada
- triggers de auditoria

## Cuidados ao alterar banco

- Nao editar migrations antigas ja aplicadas, salvo decisao explicita.
- Criar nova migration para alteracoes futuras.
- Manter `schema.prisma`, validators, repositories, types frontend e OpenAPI sincronizados.
- Avaliar backfill quando adicionar coluna `NOT NULL` em tabela existente, como feito em `add_nota_pesagem_id`.
- Evitar `prisma db push` em fluxos com migrations versionadas.

