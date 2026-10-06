# Reclassificação de registros por Sinter Feed specification

## Goal and boundaries

- Goal: evitar que um registro já recebido permaneça sem Blend quando uma classificação Sinter Feed → Blend aplicável for configurada posteriormente.
- In scope: retroclassificar records sem vínculo de classificação, automaticamente na criação de uma classificação e por endpoint protegido para recuperação operacional; informar a quantidade atualizada.
- Out of scope: alterar registros já classificados, criar Sinter Feed ou Blend automaticamente, ou mudar classificações históricas já persistidas.
- Source / approval: solicitação do usuário em 05/10/2026; implementação ainda não autorizada.

## Observed facts and open decisions

| Type | Item | Evidence or decision needed |
|---|---|---|
| Observed fact | Na ingestão, a classificação é procurada apenas uma vez e o ID encontrado é gravado no record. | `api/src/repositories/record.repository.ts` |
| Observed fact | A tela apresenta somente o Blend do vínculo persistido; vínculo nulo resulta em `-`. | `api/src/services/record.service.ts`, `web/src/components/RecordsTable.tsx` |
| Observed fact | A criação de classificação não retroclassifica records sem vínculo. | `api/src/routes/sinter-feed.routes.ts` |
| Decision | Uma reclassificação não sobrescreve records que já tenham `sinterFeedBlendMappingId`. | Preserva o histórico prometido ao cliente. |
| Decision | A reclassificação só alcança records cuja `dataHora` pertença à vigência da classificação: início inclusivo e término exclusivo. | Confirmado pelo usuário em 06/10/2026. |

## Domain

- Sinter Feed: código normalizado e persistido em `records.sinter_feed_value`.
- Classificação: relação temporal entre um Sinter Feed e um Blend.
- Reclassificação: associação em lote, auditável pela contagem retornada, de records ainda não classificados a uma classificação existente.

### Domain rules

- DR-1: ao criar uma classificação Sinter Feed → Blend, o sistema deve tentar associá-la aos records sem classificação com o mesmo Sinter Feed e `dataHora` na vigência `[startsAt, endsAt)` da relação; quando `endsAt` for nulo, a vigência não terá fim.
- DR-2: um endpoint autenticado deve permitir repetir a reclassificação para uma classificação existente, de forma idempotente.
- DR-3: a reclassificação só pode preencher `sinterFeedBlendMappingId` nulo; nunca pode substituir uma classificação já persistida.
- DR-4: o endpoint deve retornar somente a quantidade de records atualizados, sem expor dados dos records em lote.
- DR-5: uma classificação inexistente deve retornar 404; uma requisição repetida sem records elegíveis deve retornar sucesso com zero atualizações.

## Acceptance scenarios

### AC-1: criar classificação recupera registros pendentes

**Given** records sem classificação com o mesmo Sinter Feed de uma nova classificação e `dataHora` dentro de sua vigência

**When** um operador autenticado cria a classificação

**Then** os records elegíveis passam a apontar para ela

**And** a resposta informa a quantidade de records reclassificados.

### AC-1.1: registro fora da vigência não é recuperado

**Given** um record sem classificação com o mesmo Sinter Feed, mas com `dataHora` anterior ao início ou igual/após o fim da vigência

**When** a classificação for criada ou reclassificada manualmente

**Then** o record permanece sem classificação.

### AC-2: recuperação manual idempotente

**Given** uma classificação existente e records elegíveis ainda sem classificação

**When** um operador autenticado chama o endpoint de reclassificação dessa classificação

**Then** somente os records elegíveis recebem o vínculo

**And** uma nova chamada retorna sucesso com zero atualizações quando não houver pendências.

### AC-3: preservar classificação histórica

**Given** um record já vinculado a outra classificação

**When** a reclassificação de uma classificação do mesmo Sinter Feed for executada

**Then** esse record não é alterado.

## Error, authorization, and edge cases

- Os endpoints mantêm a autenticação JWT já aplicada às rotas de configuração.
- Uma classificação inexistente retorna 404.
- A operação deve usar atualização em lote atômica e filtrada no banco para evitar que duas chamadas substituam classificação existente.
- Records sem `sinterFeedValue` nunca são elegíveis.

## Technical decisions

| Decision | Chosen approach | Rationale | Consequence / migration |
|---|---|---|---|
| Recuperação automática | Executar a mesma operação de reclassificação ao criar a relação. | Evita que o cliente precise descobrir e acionar um reparo manual. | A criação passa a retornar a contagem. |
| Recuperação manual | `POST /api/sinter-feed-blend-mappings/:id/reclassify`, autenticado. | Permite corrigir pendências prévias e repetir com segurança. | Novo campo `reclassifiedCount` na resposta desse endpoint; documentação atualizada. |
| Preservação | `updateMany` com `sinterFeedBlendMappingId: null` e o Sinter Feed da relação. | Não altera o histórico já classificado. | Sem migration. |
| Vigência | Filtrar records por `dataHora >= startsAt` e, se existir término, `dataHora < endsAt`. | Mantém a classificação histórica correta sem aplicar uma relação fora do seu período. | Sem migration; o filtro passa a integrar a atualização em lote. |

## Implementation and verification plan

1. Implementar a operação reutilizável de reclassificação no backend e conectá-la à criação da classificação e ao endpoint manual.
2. Atualizar o contrato/documentação da API e, se necessário, a tela para apresentar a quantidade recuperada.
3. Cobrir AC-1, AC-1.1, AC-2 e AC-3 com testes focados; executar a validação da API e `npm run build` em `api`.

## Risks, rollout, and deferred work

- Uma execução ampla pode alterar muitos records sem vínculo; a resposta precisa registrar a contagem para conferência operacional.
- A reclassificação não desfaz uma associação já persistida; uma correção desse tipo permanece fora de escopo e requer fluxo explícito.
