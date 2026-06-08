# Backend Guide

Backend em Node.js, TypeScript, Express 5, Prisma, Zod, JWT e PostgreSQL.

## Bootstrap Express

O app Express e montado em `api/src/app.ts`.

Padrao real:

```ts
app.use("/api/docs", docsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/ingest", ingestRoutes);
app.use("/api/provision", provisionRoutes);
app.use("/api/records", csrfProtection, recordRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
```

Para registrar uma nova rota:

1. Criar `api/src/routes/<feature>.routes.ts`.
2. Exportar um `Router`.
3. Importar em `api/src/app.ts`.
4. Montar com o prefixo REST desejado.
5. Garantir que middlewares de seguranca fiquem antes do router quando aplicavel.

## Padrao de rotas Express

Rotas usam `Router` do Express e compoem middlewares por endpoint.

Exemplo real de `auth.routes.ts`:

```ts
authRoutes.post(
  "/login",
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 }),
  validate(loginSchema),
  async (req, res, next) => {
    try {
      const result = await login(req.body);
      if (!result) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);
```

Exemplo real de rota autenticada em `record.routes.ts`:

```ts
recordRoutes.use(requireAuth);

recordRoutes.post("/", validate(createRecordSchema), async (req, res) => {
  const saved = await createRecordService(req.body);
  res.status(201).json(saved);
});
```

Observacoes:

- Algumas rotas usam `try/catch` e `next(err)`.
- Algumas rotas async deixam erros subirem para o Express 5/error handler.
- Respostas seguem formato simples `{ message: string }` para erros conhecidos.

## Padrao de service

Services ficam em `api/src/services` e devem conter regra de uso/orquestracao.

Padroes reais:

- `auth.service.ts` busca usuario, compara senha com bcrypt e assina JWT.
- `record.service.ts` chama repository e sanitiza strings de saida com `xss`.
- `user.service.ts` valida duplicidade, gera `passwordHash` e retorna apenas campos seguros.

Exemplo real:

```ts
export const listRecordsService = async (filters: ListRecordsFilters) => {
  const result = await listRecords(filters);

  return {
    ...result,
    items: result.items.map(sanitizeRecord)
  };
};
```

Ao criar service novo:

- Receba tipos inferidos dos validators quando houver entrada externa.
- Chame repositories, nao Prisma diretamente, salvo excecao ja existente em `user.service.ts`.
- Evite retornar campos sensiveis.
- Sanitize dados retornados quando forem renderizados no frontend.

## Padrao de repository

Repositories ficam em `api/src/repositories` e acessam Prisma via `api/src/lib/prisma.ts`.

Exemplo real:

```ts
export const listRecords = async (filters: ListRecordsFilters): Promise<ListRecordsResult> => {
  const where = buildWhere(filters);
  const skip = (filters.page - 1) * filters.perPage;

  const [total, items] = await prisma.$transaction([
    prisma.record.count({ where }),
    prisma.record.findMany({
      where,
      orderBy: { dataHora: "desc" },
      skip,
      take: filters.perPage
    })
  ]);

  return { total, items };
};
```

Padroes encontrados:

- Prisma Client centralizado em `prisma`.
- Filtros montados com objetos tipados Prisma, sem SQL manual.
- Paginacao com `skip` e `take`.
- Ordenacao principal de registros por `dataHora desc`.
- `select` usado em criacao de usuario para evitar retorno de `passwordHash`.

Nao identificado no projeto atual:

- Repositories base/genericos.
- Transacoes de escrita complexas.
- Queries SQL raw.
- Soft delete.

## Padrao de validacao com Zod

Validators ficam em `api/src/validators`.

O middleware `validate` aceita `body`, `query` ou `params`:

```ts
validate(loginSchema)
validate(listRecordsQuerySchema, "query")
validate(updateStatusParamsSchema, "params")
```

Comportamento real de `validate.ts`:

- Usa `schema.safeParse`.
- Em erro, responde `400` com:

```json
{
  "message": "Invalid request payload",
  "details": [{ "path": "campo", "message": "mensagem" }]
}
```

- Para `body`, substitui `req.body` por `parsed.data`.
- Para `query`, salva em `res.locals.validatedQuery`.
- Para `params`, salva em `res.locals.validatedParams`.

Padroes reais de schemas:

- `.strict()` para bloquear campos extras.
- `trim`, `max`, `min`, `email`.
- `z.coerce.number()` em query.
- `.transform()` para DTO interno.
- `.superRefine()` para validacao customizada de datas.

Exemplo real de transformacao em `createRecordSchema`:

```ts
.transform((input) => ({
  dataHora: parseDateTime(input.dataHora) as Date,
  numeroNota: input.nota.numero,
  notaOriginal: input.nota.original,
  status: input.nota.status,
  notaPesagemId: input.nota.pesagemId,
  motoristaNome: input.motorista.nome,
  motoristaCelular: input.motorista.celular,
  placa: input.veiculo.placa.toUpperCase(),
  terminal: input.terminal
}));
```

## Autenticacao e autorizacao

JWT:

- Utilitario em `api/src/auth/jwt.ts`.
- `signJwt` usa issuer `"terminal-ops-api"`.
- Payload contem `sub` e `email`.
- `verifyJwt` valida assinatura e issuer.

Middleware real:

```ts
const authHeader = req.headers.authorization;

if (!authHeader?.startsWith("Bearer ")) {
  res.status(401).json({ message: "Unauthorized" });
  return;
}
```

Depois de validar, `requireAuth` popula:

```ts
req.auth = { userId: payload.sub, email: payload.email };
```

API key:

- `requireApiKey` valida header `x-api-key` contra `env.INGEST_API_KEY`.
- `requireProvisionKey` valida header `x-provision-key` contra `env.PROVISION_SECRET`.

Nao identificado no projeto atual:

- Roles/permissoes por perfil.
- Refresh token.
- Revogacao de tokens.
- Comparacao constant-time para API keys.

## Tratamento de erros

Middlewares:

- `notFoundHandler`: `404` com `{ message: "Resource not found" }`.
- `errorHandler`: loga erro com `console.error(err)` e responde `500`.

Em producao:

```ts
message: env.NODE_ENV === "production" ? "Internal server error" : err.message
```

Erros tratados diretamente em rotas:

- Login invalido: `401`.
- Registro nao encontrado em atualizacao de status: `404`.
- Email duplicado no provisionamento: `409`.
- CSV invalido/vazio/excedente: `400`.
- CSV processado parcialmente: `207`.

Nao identificado no projeto atual:

- Classe padrao de erro de aplicacao.
- Middleware para mapear erros Prisma de forma centralizada.
- Logger estruturado.

## Swagger/OpenAPI

Swagger e OpenAPI sao montados manualmente em `api/src/routes/docs.routes.ts`.

Endpoints:

- `GET /api/docs`: Swagger UI.
- `GET /api/docs/openapi.json`: documento OpenAPI gerado por `buildOpenApiDocument`.

O arquivo define manualmente:

- `components.securitySchemes`
- `components.schemas`
- `paths`
- HTML do Swagger UI via CDN `swagger-ui-dist@5`

Ao criar ou alterar endpoint, atualizar manualmente `docs.routes.ts`.

Ponto de atencao real:

- `createRecordSchema` exige `nota.pesagemId`.
- `RecordPayload` em `docs.routes.ts` nao lista `pesagemId` no schema da nota.
- Nao foi alterado nesta etapa.

## Seguranca

Mass assignment:

- Usar Zod `.strict()`.
- Transformar payload externo para DTO interno antes do repository.
- Evitar passar `req.body` bruto para Prisma sem validator.

SQL injection:

- Padrao atual usa Prisma ORM com objetos tipados.
- Nao ha SQL raw identificado.

Dados sensiveis em logs:

- Startup log nao imprime secrets.
- `PrismaClient` loga apenas `warn` e `error`.
- `errorHandler` usa `console.error(err)`, entao cuidado para nao criar erros contendo payloads sensiveis.
- Nunca logar senha, token, API key ou headers completos.

Headers e superficie HTTP:

- `helmet` ativo.
- `x-powered-by` desabilitado.
- CORS usa whitelist de `env.CORS_ORIGIN`.
- Body JSON limitado a `100kb`.
- HTTPS exigido em producao por `enforceHttps`.
- Rate limit global e rate limits especificos em login, ingest e provisionamento.

Pontos de atencao:

- `allowedHeaders` do CORS inclui `Content-Type`, `Authorization`, `X-API-Key`; `X-Provision-Key` nao aparece em `app.ts`.
- `csrfProtection` e aplicado em `/api/records`, inclusive para rotas de status por API key dentro desse router.

