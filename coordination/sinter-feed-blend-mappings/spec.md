# Sinter Feed para Blend specification

## Goal and boundaries

- Goal: classificar cada Sinter Feed por Blend, sem qualquer vínculo da classificação com a empresa/fornecedor.
- In scope: substituir a estrutura e API de relação fornecedor + Sinter Feed + Blend por Sinter Feed + Blend; adaptar ingestão, records, relatórios e tela de configuração; excluir a única relação de teste existente durante a migração.
- Out of scope: excluir fornecedores ou a identificação de fornecedor do record; inferir Blend quando não houver relação configurada.
- Source / approval: solicitação do usuário em 2026-09-22, confirmada com autorização para excluir a relação de teste atual.

## Observed facts and open decisions

| Type | Item | Evidence or decision needed |
|---|---|---|
| Observed fact | A classificação atual depende de `issuer_sinter_feed_mappings`, inclusive em records e relatórios. | Schema, ingestão e relatórios atuais. |
| Decision | A relação de teste existente pode ser excluída na migration. | Confirmado pelo usuário em 2026-09-22. |
| Decision | A classificação não depende mais de empresa/fornecedor. | Confirmado pelo usuário em 2026-09-22. |

## Domain

- Glossary and actors: Sinter Feed é o código recebido na nota; Blend é sua classificação configurável; operador autenticado administra a relação.

### Domain rules

- DR-1: uma relação de classificação conecta exclusivamente um Sinter Feed a um Blend, com vigência e estado ativo.
- DR-2: não podem existir duas relações ativas e sobrepostas para o mesmo Sinter Feed.
- DR-3: ao ingerir um record com Sinter Feed, o sistema associa a relação ativa vigente desse feed, independentemente de fornecedor ou da presença de chave da nota.
- DR-4: records e relatórios usam a relação persistida para preservar a classificação histórica.
- DR-5: a migration remove a relação de teste de fornecedor; não deve migrá-la nem manter dependências de fornecedor na classificação.

## Acceptance scenarios

### AC-1: classificação por Sinter Feed

**Given** um Sinter Feed com uma relação ativa vigente para um Blend

**When** um record é ingerido com esse Sinter Feed, com ou sem empresa identificada

**Then** o record fica associado à relação Sinter Feed → Blend.

### AC-2: configuração sem fornecedor

**Given** os catálogos ativos de Sinter Feed e Blend

**When** o operador cria uma relação

**Then** a interface solicita somente Sinter Feed, Blend e início de vigência.

### AC-3: migração da estrutura de teste

**Given** a relação fornecedor + Sinter Feed + Blend de teste existente

**When** a migration for aplicada

**Then** ela e suas referências são removidas, e a nova estrutura fica vazia para configuração explícita.

## Technical decisions

| Decision | Chosen approach | Rationale | Consequence / migration |
|---|---|---|---|
| Relacionamento | Nova tabela temporal `sinter_feed_blend_mappings`. | Mantém histórico por record sem usar fornecedor. | Remove `issuer_sinter_feed_mappings` e troca a FK de records. |
| Histórico | `records` aponta para a nova relação. | Relatórios preservam o Blend que classificou o carregamento. | A relação de teste e seus vínculos são apagados conforme autorização. |
| Administração | A página Sinter Feed e blends gerencia a nova relação; a rota de classificações por fornecedor é removida. | Elimina a noção de classificação por fornecedor da UI. | Endpoints e cliente usam `sinter-feed-blend-mappings`. |

## Implementation and verification plan

1. Criar migration e modelo Prisma sem vínculo com empresa.
2. Atualizar API, ingestão, records e relatórios para a nova FK.
3. Atualizar a tela e remover a rota/tela de classificação por fornecedor.
4. Executar builds API/web e validar o diff contra DR-1 a DR-5 e AC-1 a AC-3.
