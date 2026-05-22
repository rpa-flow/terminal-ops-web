# Frontend Guide

Frontend em React, Vite, TypeScript, React Router e TailwindCSS.

## Entrada e rotas

Entrada real em `web/src/main.tsx`:

```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

Rotas reais em `web/src/App.tsx`:

```tsx
<AuthProvider>
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <RecordsPage />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
</AuthProvider>
```

Para criar nova tela:

1. Criar pagina em `web/src/pages/<FeaturePage>.tsx`.
2. Criar componentes em `web/src/components` quando reutilizaveis ou grandes.
3. Criar service em `web/src/services`.
4. Criar tipos em `web/src/types`.
5. Registrar rota em `web/src/App.tsx`.
6. Proteger com `ProtectedRoute` quando exigir JWT.

## Padrao de paginas React

Paginas atuais sao componentes funcionais com estado local.

`LoginPage.tsx`:

- Mantem `email`, `password`, `error`, `loading`.
- Usa `loginRequest`.
- Em sucesso chama `setSession`.
- Se ja houver token, redireciona para `/`.

`RecordsPage.tsx`:

- Mantem filtros, itens, total, loading, error e estado do modal.
- Busca dados com `listRecordsRequest`.
- Passa dados e callbacks para `FiltersBar`, `RecordsTable` e `CsvUploadModal`.

Padrao real de carregamento:

```tsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

## Padrao de componentes

Componentes usam props tipadas e Tailwind diretamente no JSX.

Exemplos:

- `ProtectedRoute`: componente de controle de acesso.
- `FiltersBar`: inputs e botoes de filtro.
- `RecordsTable`: tabela de registros e empty state.
- `CsvUploadModal`: modal com upload e feedback de resultado.

Padrao real:

```tsx
type Props = {
  filters: RecordFilters;
  onChange: (filters: RecordFilters) => void;
  onApply: () => void;
  onClear: () => void;
};
```

Nao identificado no projeto atual:

- Biblioteca de UI.
- Sistema de design componentizado alem das classes globais `.input`, `.btn-primary` e `.btn-muted`.
- Gerenciador global de estado alem de Context para auth.

## Padrao de hooks

Hook/contexto real:

- `web/src/hooks/useAuth.tsx`

Responsabilidades:

- Guarda token em `localStorage` com chave `rpa_token`.
- Mantem `token`, `user`, `loading`.
- Valida token existente com `meRequest`.
- Expoe `setSession` e `logout`.

Exemplo real:

```tsx
const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
```

Nao identificado no projeto atual:

- Hooks de data fetching por recurso.
- SWR/React Query.
- Persistencia segura por cookie HttpOnly.

## Padrao de chamada de API

Wrapper HTTP real em `web/src/services/http.ts`.

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
```

`http<T>`:

- Monta URL com query params.
- Usa `fetch`.
- Envia `Content-Type: application/json` quando nao ha `FormData`.
- Envia `Authorization: Bearer <token>` quando `token` e informado.
- Lanca `Error` se `response.ok` for falso.
- Retorna `response.json()` tipado como `T`.

Services atuais:

- `auth.service.ts`: `loginRequest`, `meRequest`.
- `records.service.ts`: `listRecordsRequest`, `uploadCsvRequest`.

Padrao para novo service:

```ts
export const featureRequest = (token: string): Promise<FeatureResponse> => {
  return http<FeatureResponse>("/feature", { token });
};
```

## Autenticacao no frontend

Fluxo real:

1. `LoginPage` chama `loginRequest`.
2. Backend retorna `token` e `user`.
3. `setSession` salva token no `localStorage`.
4. `AuthProvider` mantem usuario em memoria.
5. `ProtectedRoute` bloqueia acesso sem token.
6. `logout` remove token do `localStorage`.

Ponto de seguranca:

- Token JWT fica em `localStorage`. Isso facilita uso pelo frontend, mas aumenta impacto de XSS.
- Backend faz sanitizacao de saida em registros, mas novas telas devem continuar evitando renderizacao de HTML bruto.

## Formularios

Padrao real:

- Campos controlados com `useState`.
- `onSubmit` faz `event.preventDefault()`.
- Estado `loading` desabilita botao e troca texto.
- Erro exibido em texto ou box vermelho.
- Inputs usam classe global `.input`.
- Botoes usam `.btn-primary` e `.btn-muted`.

Exemplo real:

```tsx
<button className="btn-primary mt-6 w-full" type="submit" disabled={loading}>
  {loading ? "Entrando..." : "Entrar"}
</button>
```

Nao identificado no projeto atual:

- React Hook Form.
- Validacao client-side com Zod.
- Componentes padrao de `Field`, `FormMessage` ou similares.

## Tabelas e listagens

Padrao real em `RecordsTable.tsx`:

- Wrapper com `overflow-x-auto`.
- Tabela `min-w-full text-left text-sm`.
- Cabecalho com `bg-slate-50`.
- Linhas separadas por borda.
- Badge de status com `rounded-full bg-slate-100`.
- Empty state simples quando `items.length === 0`.

Paginacao real em `RecordsPage.tsx`:

- Estado `page` e `perPage` dentro de `filters`.
- Botao anterior desabilita em `page <= 1`.
- Botao proxima desabilita quando `items.length < filters.perPage`.
- Total exibido acima da tabela.

## Filtros

Padrao real em `FiltersBar.tsx`:

- Grid responsivo `md:grid-cols-3 lg:grid-cols-6`.
- Inputs para datas, status, motorista, placa e terminal.
- Ao alterar filtro, pagina volta para `1`.
- Placa e convertida para uppercase no cliente.
- Botao `Filtrar` aplica busca.
- Botao `Limpar` restaura filtros iniciais.

## Loading, error e empty state

Loading:

- `ProtectedRoute` mostra tela centralizada com `"Carregando..."`.
- Botoes trocam texto em submit/importacao.

Error:

- `LoginPage`: texto `text-rose-600`.
- `RecordsPage`: box `border-rose-200 bg-rose-50`.
- `CsvUploadModal`: box `border-red-200 bg-red-50`.

Empty:

- `RecordsTable`: `"Sem registros para os filtros aplicados."`.

Nao identificado no projeto atual:

- Skeleton loaders.
- Toast notifications.
- Error boundary.

## Padrao visual com TailwindCSS

TailwindCSS v4 e carregado em `web/src/index.css`:

```css
@import "tailwindcss";
```

Classes globais reais:

```css
.input {
  @apply w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100;
}

.btn-primary {
  @apply rounded-xl bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-sky-300;
}

.btn-muted {
  @apply rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50;
}
```

Visual atual:

- Fundo predominante `slate-50`/`white`.
- Texto `slate-900`, `slate-700`, `slate-600`, `slate-500`.
- Acao primaria em `sky-700`.
- Bordas `slate-200`/`slate-300`.
- Cards e modais com `rounded-2xl`, borda e sombra leve.

Ponto de atencao:

- `web/src/App.css` contem estilos de template Vite/React, mas `App.tsx` nao importa esse arquivo. O padrao visual ativo esta em `index.css` e classes Tailwind no JSX.

