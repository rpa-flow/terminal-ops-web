# Registros RPA — refinamento de interface specification

## Goal and boundaries

- Goal: tornar a consulta de Registros RPA mais legível, orientada à operação e utilizável em desktop e mobile, preservando a identidade Corporate Precision.
- In scope: hierarquia do cabeçalho, filtros, tabela, paginação, estados de carregamento/erro/vazio, acessibilidade e comportamento responsivo da navegação compartilhada.
- Out of scope: APIs, contratos, regras de filtro, dados, permissões, rotas e importação CSV.
- Source / approval: solicitação do usuário em 30/09/2026, acompanhada da captura da tela de Registros.

## Observed facts and open decisions

| Type | Item | Evidence or decision needed |
|---|---|---|
| Observed fact | O projeto define Manrope, superfícies azuladas, azul primário e teal secundário como a identidade Corporate Precision. | `design.md` e `web/src/index.css` |
| Observed fact | `FiltersBar`, `RecordsTable`, `BrazilianDateInput`, botões e tokens de superfície já são reutilizáveis. | `web/src/components/` |
| Observed fact | A sidebar mobile fixa pode exceder os 112px reservados pela página. | `web/src/index.css` |
| Assumption | Um menu compacto no mobile é uma correção de apresentação da navegação, não uma mudança de regra ou rota. | Não altera destinos nem estado de negócio. |

## Domain

- Glossary and actors: operador autenticado consulta, filtra, atualiza e importa registros TBJC.
- State/lifecycle changes: nenhum.

### Domain rules

- DR-1: A página deve continuar usando exclusivamente tokens, componentes e paleta já presentes no produto.
- DR-2: Aplicar, limpar, atualizar, paginar e importar CSV devem manter as mesmas chamadas e parâmetros atuais.
- DR-3: Enquanto uma consulta estiver em curso, a interface deve comunicar o estado e impedir ações concorrentes que acionem a mesma consulta.
- DR-4: A tabela deve comunicar adequadamente resultados, ausência de dados e falhas, sem perder acesso ao novo carregamento.
- DR-5: Em telas pequenas, a navegação deve permanecer alcançável sem cobrir o conteúdo da página.

## Acceptance scenarios

### AC-1: Filtrar registros com contexto

**Given** operador na página de Registros

**When** observa ou navega pelos filtros

**Then** encontra um título de seção, rótulos visíveis e campos agrupados de modo responsivo.

### AC-2: Consultar a lista e sua paginação

**Given** uma consulta retorna registros

**When** a tabela é exibida

**Then** o operador vê a faixa exibida, o total, cabeçalhos legíveis e linhas com retorno visual de interação.

### AC-3: Reconhecer estados da consulta

**Given** uma consulta está carregando, falha ou não encontra resultados

**When** a página atualiza

**Then** cada estado é identificado por texto acessível e a ação de tentar novamente permanece disponível na falha.

### AC-4: Usar a tela no mobile

**Given** viewport menor que 768px

**When** o operador abre a navegação

**Then** ela aparece como painel acessível, sem sobrepor permanentemente o conteúdo, e pode ser fechada.

## Error, authorization, and edge cases

- Manter o texto de erro e o contrato de autenticação existentes.
- Não alterar a semântica de páginas vazias, exceto a sua apresentação.
- Aplicar `disabled` às ações de consulta durante carregamento; logout e links não são bloqueados.

## Technical decisions

| Decision | Chosen approach | Rationale | Consequence / migration |
|---|---|---|---|
| Sistema visual | Reutilizar `surface-card`, `input`, `btn-primary`, `btn-muted` e tokens Tailwind atuais. | Mantém identidade e evita uma tela isolada. | Sem migração. |
| Filtros | Estender `FiltersBar` com cabeçalho, labels e estado `disabled`. | Corrige contexto e acessibilidade sem mexer no formato dos filtros. | Sem alteração de API. |
| Lista | Estender `RecordsTable` com loading, empty state tabular e semântica. | Evita estados ambíguos e preserva o componente da lista. | Sem alteração de dados. |
| Mobile | Usar o `AppNavigation` existente como painel recolhível apenas abaixo de `md`. | Evita o conflito de altura da sidebar fixa e mantém uma única navegação. | Sem rotas novas. |

## Implementation and verification plan

1. Refinar `RecordsPage`, `FiltersBar` e `RecordsTable` usando apenas os tokens existentes.
2. Corrigir a apresentação mobile de `AppNavigation` e estilos globais associados.
3. Executar typecheck, lint e build do frontend; revisar visualmente desktop e mobile.
4. Validar de forma independente DR-1 a DR-5 e AC-1 a AC-4.

## Risks, rollout, and deferred work

- As demais telas mantêm seus layouts; a alteração compartilhada limita-se à apresentação mobile da navegação.
- A cobertura automatizada de componentes não existe no projeto; a revisão visual e os checks de TypeScript/lint/build são necessários.
