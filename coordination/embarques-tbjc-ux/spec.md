# Embarques TBJC — refinamento de interface

## Goal and boundaries

- Goal: melhorar a leitura operacional e os estados da tela de Embarques TBJC.
- In scope: métricas, formulário, feedback, tabela e responsividade.
- Out of scope: APIs, cálculos, validações de negócio, rotas e exclusão.
- Source / approval: usuário aprovou a revisão em 01/10/2026.

## Domain rules

- DR-1: Criar, listar e excluir embarques deve preservar serviços e payloads atuais.
- DR-2: Volume deve ser exibido em toneladas e o Blend permanece obrigatório para TBJC.
- DR-3: Carregamento, erro, sucesso e ausência de registros devem ser comunicados.
- DR-4: A tabela deve permanecer consultável em mobile.

## Acceptance scenarios

### AC-1: Registrar embarque

**Given** operador no TBJC

**When** preenche os dados obrigatórios

**Then** vê o estado de salvamento e recebe feedback após a operação.

### AC-2: Consultar embarques

**Given** a página carrega, falha ou não possui itens

**When** a lista é exibida

**Then** o estado fica explícito e a tentativa pode ser repetida após erro.

## Technical decisions

| Decision | Chosen approach | Rationale |
|---|---|---|
| Métricas | Skeleton textual e unidade `t` | Evita zero enganoso e deixa a medida clara. |
| Tabela | Cabeçalho, empty state e rolagem orientada | Mantém dados largos utilizáveis em mobile. |

## Verification plan

1. Executar `git diff --check`.
2. Validar o diff contra DR-1 a DR-4 e AC-1 a AC-2.
