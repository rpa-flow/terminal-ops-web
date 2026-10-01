# Relatórios TBJC — refinamento de interface specification

## Goal and boundaries

- Goal: tornar o relatório TBJC mais hierárquico, legível e eficiente para consulta operacional em desktop e mobile.
- In scope: filtros, hierarquia dos indicadores, estados de consulta, apresentação de gráficos e tabelas, responsividade e acessibilidade em `ReportsPage`.
- Out of scope: APIs, cálculo de indicadores, filtros enviados, rotas, permissões e dados retornados pelo relatório.
- Source / approval: revisão da tela publicada e aprovação explícita do usuário em 01/10/2026.

## Observed facts and open decisions

| Type | Item | Evidence or decision needed |
|---|---|---|
| Observed fact | A página usa os tokens Corporate Precision, mas o gráfico de Sinter Feed adiciona cores fora da paleta. | `ReportsPage.tsx`, `design.md` |
| Observed fact | Os cinco indicadores TBJC deixam um card isolado na grade de quatro colunas. | `ReportsPage.tsx` |
| Observed fact | Carregamento não possui representação visual e a falha não oferece nova tentativa. | `ReportsPage.tsx` |
| Assumption | Mostrar o terminal como contexto, não como input editável, preserva o mesmo filtro fixo enviado à API. | `getDefaultFilters` mantém `terminal`. |

## Domain rules

- DR-1: Os filtros e a consulta devem preservar os mesmos valores e chamadas de API atuais.
- DR-2: A tela deve usar exclusivamente a paleta, tipografia e superfícies já definidas pelo produto.
- DR-3: KPIs operacionais devem ter leitura prioritária; a quantidade não classificada deve ser tratada como atenção contextual.
- DR-4: Carregamento, erro e ausência de dados devem ser perceptíveis e acessíveis.
- DR-5: Em viewport pequeno, gráficos e tabelas devem continuar consultáveis, com orientação de rolagem quando necessária.

## Acceptance scenarios

### AC-1: Consultar período

**Given** operador no relatório TBJC

**When** observa os filtros

**Then** identifica o período, o terminal fixo e as ações de atualização e limpeza sem campos aparentemente editáveis sem necessidade.

### AC-2: Identificar a situação operacional

**Given** o relatório retorna dados TBJC

**When** a visão do período é exibida

**Then** vê os quatro KPIs principais antes dos detalhes e um aviso contextual para registros não classificados.

### AC-3: Consultar classificação e saldo

**Given** há dados classificados

**When** abre os detalhes de Sinter Feed e Blend

**Then** encontra gráficos e tabelas sem cores externas à paleta, com detalhes tabulares sob demanda.

### AC-4: Lidar com estados da consulta

**Given** a consulta carrega, falha ou não traz valores

**When** a tela atualiza

**Then** o estado é comunicado por texto acessível e a nova tentativa está disponível após falha.

## Technical decisions

| Decision | Chosen approach | Rationale | Consequence / migration |
|---|---|---|---|
| Paleta de Sinter Feed | Alternar apenas azul primário e teal, com opacidade para séries adicionais. | Mantém identidade sem adicionar cores arbitrárias. | Sem migração. |
| Indicadores TBJC | Manter quatro KPIs e extrair não classificados para alerta contextual. | Resolve a card órfão e destaca exceção. | Sem mudança de cálculo. |
| Detalhamento | Manter gráfico de Sinter Feed e ocultar a tabela diária em disclosure nativo; exibir saldo por Blend como tabela de decisão. | Reduz repetição e comprimento da página. | Sem mudança de dados. |
| Mobile | Indicar rolagem horizontal nos painéis de dados largos. | Evita que conteúdo crítico pareça truncado. | Sem nova dependência. |

## Implementation and verification plan

1. Refinar a composição e estados de `ReportsPage` sem alterar `reports.service.ts` ou tipos de contrato.
2. Executar typecheck, lint e build do frontend quando o ambiente permitir.
3. Validar de forma independente DR-1 a DR-5 e AC-1 a AC-4.
