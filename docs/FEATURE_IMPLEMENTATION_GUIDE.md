# Feature Implementation Guide

Guia para criar uma nova feature fullstack seguindo os padroes reais do projeto.

## Principio geral

Antes de implementar:

- Ler os arquivos existentes da area afetada.
- Confirmar contrato no backend, frontend e banco.
- Usar os padroes atuais em vez de introduzir biblioteca nova.
- Nao alterar regras de negocio existentes sem pedido explicito.
- Quando um padrao nao existir, registrar como decisao nova antes de aplicar.

## Passo a passo backend

### 1. Modelar banco, se necessario

Arquivo:

```text
api/prisma/schema.prisma
```

Criar ou alterar model com:

- Tipos Prisma explicitos.
- `@map` para nomes snake_case no banco quando seguir o padrao atual.
- `@@map` para nome da tabela.
- `@@index` para campos filtrados/ordenados.
- `@unique`/`@@unique` quando houver unicidade real.

Criar migration:

```bash
cd api
npx prisma migrate dev --name nome_da_feature
npm run prisma:generate
```

Aplicar migrations existentes:

```bash
cd api
npm run prisma:migrate
```

### 2. Criar validator Zod

Arquivo sugerido:

```text
api/src/validators/<feature>.validator.ts
```

Padroes a seguir:

- Usar `.strict()`.
- Limitar tamanhos com `.max()`.
- Normalizar com `.trim()`, `.toLowerCase()` ou `.toUpperCase()` quando ja for regra do dado.
- Transformar payload externo para DTO interno quando o formato da API for diferente do model.
- Exportar tipos com `z.infer`.

Exemplo de estilo:

```ts
export const createFeatureSchema = z
  .object({
    name: z.string().trim().min(1).max(120)
  })
  .strict();

export type CreateFeatureInput = z.infer<typeof createFeatureSchema>;
```

### 3. Criar repository

Arquivo sugerido:

```text
api/src/repositories/<feature>.repository.ts
```

Padroes a seguir:

- Importar `prisma` de `../lib/prisma`.
- Usar Prisma ORM, nao concatenar SQL.
- Criar funcoes pequenas por operacao.
- Montar filtros em objetos tipados.
- Usar `select` para evitar dados sensiveis quando necessario.

Exemplo de estilo:

```ts
export const findFeatureById = async (id: string) => {
  return prisma.feature.findUnique({ where: { id } });
};
```

### 4. Criar service

Arquivo sugerido:

```text
api/src/services/<feature>.service.ts
```

Padroes a seguir:

- Receber tipos vindos dos validators.
- Chamar repositories.
- Concentrar regras de caso de uso.
- Nao retornar segredo, senha, token ou hash desnecessario.
- Sanitizar saida quando dados serao renderizados.

### 5. Criar route

Arquivo sugerido:

```text
api/src/routes/<feature>.routes.ts
```

Padroes a seguir:

- Criar `const featureRoutes = Router();`.
- Aplicar `validate(schema)` no endpoint.
- Aplicar `requireAuth`, `requireApiKey` ou `requireProvisionKey` conforme o caso.
- Responder status code coerente.
- Retornar JSON.

Exemplo:

```ts
featureRoutes.post("/", requireAuth, validate(createFeatureSchema), async (req, res) => {
  const saved = await createFeatureService(req.body);
  res.status(201).json(saved);
});
```

### 6. Registrar route

Arquivo:

```text
api/src/app.ts
```

Adicionar import e montagem:

```ts
app.use("/api/features", csrfProtection, featureRoutes);
```

Use `csrfProtection` para rotas consumidas pelo frontend autenticado quando houver metodos mutaveis, seguindo o padrao de `/api/records`.

### 7. Atualizar Swagger/OpenAPI

Arquivo:

```text
api/src/routes/docs.routes.ts
```

Adicionar:

- Schema de request.
- Schema de response.
- Path/method.
- Security adequada.
- Status codes esperados.

Manter exemplos alinhados aos validators Zod.

## Passo a passo frontend

### 1. Criar tipos

Arquivo atual comum:

```text
web/src/types/api.ts
```

Adicionar tipos de request/response da nova feature ou criar arquivo especifico em `web/src/types` se crescer muito.

### 2. Criar service

Arquivo sugerido:

```text
web/src/services/<feature>.service.ts
```

Usar `http<T>` de `web/src/services/http.ts`.

Exemplo:

```ts
export const listFeaturesRequest = (token: string): Promise<FeatureListResponse> => {
  return http<FeatureListResponse>("/features", { token });
};
```

Para upload:

```ts
const formData = new FormData();
return http<ResponseType>("/features/upload", { method: "POST", formData, token });
```

### 3. Criar hook, se necessario

Onde:

```text
web/src/hooks/use<Feature>.ts
```

Nao existe padrao atual de hook de data fetching. Se a feature for simples, manter estado na pagina como `RecordsPage`.

### 4. Criar pagina

Onde:

```text
web/src/pages/<FeaturePage>.tsx
```

Padroes atuais:

- `useState` para filtros, itens, loading e error.
- `useEffect` para carga inicial.
- Callbacks passados para componentes.
- Mensagens simples de erro.
- Tailwind direto no JSX.

### 5. Criar componentes

Onde:

```text
web/src/components/<ComponentName>.tsx
```

Separar quando houver:

- tabela/listagem
- barra de filtros
- modal
- formulario grande
- componente reutilizavel

Usar classes globais existentes:

- `.input`
- `.btn-primary`
- `.btn-muted`

### 6. Registrar rota

Arquivo:

```text
web/src/App.tsx
```

Para rota protegida:

```tsx
<Route
  path="/features"
  element={
    <ProtectedRoute>
      <FeaturePage />
    </ProtectedRoute>
  }
/>
```

## Arquivos normalmente necessarios

Backend:

- `api/prisma/schema.prisma`
- `api/prisma/migrations/<timestamp>_<name>/migration.sql`
- `api/src/validators/<feature>.validator.ts`
- `api/src/repositories/<feature>.repository.ts`
- `api/src/services/<feature>.service.ts`
- `api/src/routes/<feature>.routes.ts`
- `api/src/app.ts`
- `api/src/routes/docs.routes.ts`

Frontend:

- `web/src/types/api.ts`
- `web/src/services/<feature>.service.ts`
- `web/src/pages/<FeaturePage>.tsx`
- `web/src/components/<FeatureTable>.tsx`
- `web/src/components/<FeatureFilters>.tsx`
- `web/src/App.tsx`

Nem toda feature precisa de todos esses arquivos. Seguir o menor conjunto que preserve os padroes.

## Como testar manualmente

Backend:

1. Subir PostgreSQL/API.
2. Aplicar migrations.
3. Rodar seed se precisar de usuario.
4. Testar `/health`.
5. Fazer login em `/api/auth/login`.
6. Testar endpoint protegido com `Authorization: Bearer <token>`.
7. Testar validacao enviando payload invalido.
8. Conferir status codes de sucesso e erro.
9. Conferir Swagger em `/api/docs`.

Frontend:

1. Configurar `VITE_API_BASE_URL` ou usar proxy local `/api`.
2. Rodar Vite.
3. Fazer login.
4. Navegar para a nova tela.
5. Testar loading, erro, vazio e sucesso.
6. Testar filtros/paginacao/formularios.
7. Conferir responsividade basica.

Comandos existentes:

```bash
cd api
npm run build
```

```bash
cd web
npm run typecheck
npm run build
npm run lint
```

## Harness engineering antes de concluir

Use [HARNESS_ENGINEERING_GUIDE.md](./HARNESS_ENGINEERING_GUIDE.md) como checklist de prontidao.

Para cada feature, registrar mentalmente ou na descricao da mudanca:

- Quais contratos mudaram: banco, validator, route, OpenAPI, frontend types.
- Quais gates foram executados: backend build, frontend typecheck/lint/build, teste manual.
- Qual dado de teste foi usado: seed admin, payload JSON, CSV ou fixture manual.
- Qual fluxo foi testado: sucesso, validacao invalida, nao autenticado/nao autorizado e vazio quando aplicavel.
- Quais lacunas permanecem por falta de harness automatizado.

Gate minimo por area:

- Backend: `cd api && npm run build`.
- Frontend: `cd web && npm run typecheck`, `cd web && npm run lint`, `cd web && npm run build`.
- Banco: migration criada/aplicada localmente e Prisma Client gerado.
- API: Swagger/OpenAPI atualizado manualmente.
- Fullstack: fluxo manual no navegador ou via HTTP.

Nao identificado no projeto atual:

- Comando unico de verificacao para o monorepo.
- Test suite automatizada.
- CI versionado.
- Contract test automatico.

## Checklist de seguranca para nova feature

- Validator Zod `.strict()` no body/query/params.
- Nenhum campo extra externo chegando ao Prisma.
- Nenhum segredo em response.
- Nenhum segredo em log.
- Prisma ORM em vez de SQL concatenado.
- `select` quando model tiver campos sensiveis.
- JWT/API key aplicados antes do handler.
- CORS/CSRF considerados para endpoints mutaveis.
- Swagger atualizado com auth correta.
- Frontend nao usa `dangerouslySetInnerHTML`.
- Erros do frontend nao exibem detalhes sensiveis.
