# Chave de acesso da nota e emitentes — specification

## Goal and boundaries

- Goal: permitir que a ingestão técnica de records receba e preserve a chave de acesso de 44 dígitos da nota de transporte, derive o CNPJ do emitente da chave e mantenha um cadastro automático e reutilizável de emitentes.
- In scope: `POST /api/ingest/records`, validação e persistência da chave em `records.nota_chave`, nova entidade de emitente, migração Prisma e documentação da API.
- Out of scope: consulta externa de dados cadastrais, interface administrativa de emitentes, alteração da rota autenticada `POST /api/records`, e reprocessamento de records existentes.
- Source / approval: solicitação do usuário em 2026-09-15; escopo aprovado para implementação em 2026-09-15.

## Observed facts and open decisions

| Type | Item | Evidence or decision needed |
|---|---|---|
| Observed fact | A rota técnica que grava records é `POST /api/ingest/records`, protegida por `x-api-key`. | `api/src/routes/ingest.routes.ts` |
| Observed fact | `records` já tem a coluna legada `emitente_cnpj`, sem relação referencial. | `api/prisma/schema.prisma` |
| Observed fact | A chave já pode ser recebida em `nota.chave` e é persistida em `records.nota_chave`, mas não é obrigatória para `/api/ingest/records`. | `api/src/validators/record.validator.ts` e `api/prisma/schema.prisma` |
| Decision | A referência a “XML” significa a chave de acesso da nota, composta exclusivamente por 44 dígitos; nenhum arquivo XML será recebido ou armazenado. | Esclarecimento do usuário em 2026-09-15. |
| Decision | A chave continua opcional na ingestão técnica; quando fornecida, deve conter exatamente 44 dígitos. | Esclarecimento do usuário em 2026-09-15. |
| Assumption | O CNPJ será derivado dos dígitos 7–20 da chave de acesso (índices 6–19), normalizado para 14 dígitos, e substituirá qualquer CNPJ informado manualmente no payload. | Layout padrão de chave fiscal de 44 dígitos; confirmação de precedência. |
| Open decision | Quais são os “dados dos emitentes” além da descrição? | Proposta mínima: `cnpj`, `descricao`, `created_at`, `updated_at`; nome do XML não será sobrescrito automaticamente. |

## Domain

- Glossary and actors: terminal é o cliente autenticado pela API key; emitente é a pessoa jurídica identificada pelo CNPJ no XML; record é o registro de recebimento já existente.
- State/lifecycle changes: ao receber uma chave de acesso válida, o sistema localiza ou cria o emitente pelo CNPJ derivado e associa o novo record a ele.

### Domain rules

- DR-1: a ingestão técnica pode receber a chave de acesso da nota no campo existente `nota.chave`; quando informada, ela deve conter exatamente 44 dígitos.
- DR-2: a chave recebida deve ser preservada em `records.nota_chave`.
- DR-3: o sistema deve derivar o CNPJ do emitente dos 14 dígitos nas posições 7 a 20 da chave e gravar o valor no campo `records.emitente_cnpj`.
- DR-4: para um CNPJ válido extraído, o sistema deve criar automaticamente um emitente se ainda não existir um, ou reutilizar o emitente já cadastrado; o record deve manter a relação referencial com ele.
- DR-5: o cadastro automático não deve substituir uma descrição já preenchida para o emitente.

## Acceptance scenarios

### AC-1: ingestão com chave de acesso e emitente novo

**Given** um terminal autenticado e um payload de record válido com `nota.chave` de 44 dígitos

**When** ele envia `POST /api/ingest/records`

**Then** a API cria o record, preserva a chave e grava em `emitente_cnpj` os 14 dígitos de CNPJ derivados dela

**And** cria um emitente para esse CNPJ e associa o record a ele.

### AC-2: ingestão com emitente já cadastrado

**Given** um emitente já cadastrado para o CNPJ derivado e uma chave válida para o mesmo CNPJ

**When** um terminal ingere um novo record

**Then** o novo record é associado ao emitente existente

**And** os dados administráveis já existentes do emitente não são substituídos.

### AC-3: chave ausente

**Given** um payload de record válido sem `nota.chave`

**When** um terminal o ingere

**Then** a API cria o record sem associação automática a emitente

**And** mantém o comportamento atual para CNPJ e fornecedor enviados manualmente.

### AC-4: chave inválida

**Given** um payload com `nota.chave` contendo caracteres não numéricos ou tamanho diferente de 44 dígitos

**When** um terminal o ingere

**Then** a API responde 400 e não cria record nem emitente.

## Error, authorization, and edge cases

- A rota continua exigindo `x-api-key`; não haverá nova permissão.
- A criação/reutilização do emitente e a criação do record devem ocorrer em uma transação.
- A unicidade de CNPJ deve ser garantida no banco para suportar requisições concorrentes.

## Technical decisions

| Decision | Chosen approach | Rationale | Consequence / migration |
|---|---|---|---|
| Contrato da chave | `nota.chave` opcional, mas com exatamente 44 dígitos quando presente, na rota de ingestão. | Preserva a compatibilidade com terminais que ainda não enviam a chave. | Ajustar o validador específico de ingestão, OpenAPI e documentação. |
| Armazenamento | Reutilizar `records.nota_chave`. | A coluna já existe e armazena a chave solicitada. | Não requer nova coluna de chave. |
| Cadastro | Tabela `issuers`, com CNPJ único, descrição anulável e timestamps; `records.issuer_id` aponta para ela. | Segue o padrão de nomes em inglês do schema e conserva o campo legado solicitado. | Criar tabela, índice/foreign key e coluna anulável em records. |
| Extração | Usar `nota.chave.slice(6, 20)` depois de validar os 44 dígitos. | A composição padronizada da chave reserva essas posições para o CNPJ. | Não introduz dependência de parser XML. |

## Implementation and verification plan

1. Confirmar o uso opcional de `nota.chave` na rota técnica e os dados cadastrais mínimos do emitente.
2. Criar a migração Prisma e os modelos relacionais.
3. Validar e derivar o CNPJ da chave na ingestão; gravar record e emitente em transação.
4. Atualizar o contrato OpenAPI e a documentação.
5. Executar build e testes focados para AC-1 a AC-4.

## Risks, rollout, and deferred work

- A coluna de CNPJ legada permanecerá para compatibilidade; a relação será preenchida apenas em novas ingestões com chave válida.
- A obtenção de razão social/endereço de fontes externas está explicitamente adiada.
