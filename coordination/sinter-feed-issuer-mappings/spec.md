# Sinter feed por fornecedor e blend specification

## Goal and boundaries

- Goal: receber o identificador Sinter Feed de cada carregamento e manter uma configuração administrável pelo cliente que relacione fornecedor, Sinter Feed e blend.
- In scope: campo na ingestão de records, persistência da associação do carregamento, cadastros configuráveis de Sinter Feeds, blends e seus relacionamentos com fornecedores.
- Out of scope: cadastro inicial com base na planilha fornecida, inferência automática de material/blend, cálculo de saldos ou dashboards.
- Source / approval: solicitação do usuário em 2026-09-15 e documento `Melhorias_Planilha_WEB.docx`; estrutura e implementação aprovadas em 2026-09-15.

## Observed facts and open decisions

| Type | Item | Evidence or decision needed |
|---|---|---|
| Observed fact | A planilha descreve uma relação conceitual de material, identificação Sinter Feed e blend; há valores como `SINTER FEED M01`, blend `1` e blend `2`. | Documento fornecido pelo usuário. |
| Observed fact | `records` já pode ser vinculado automaticamente a um fornecedor (`issuers`) pela chave de 44 dígitos, quando ela é enviada. | Implementação anterior da ingestão. |
| Decision | O Sinter Feed será enviado como `nota.sinterFeed`, texto opcional, por exemplo `SINTER FEED M01`. | Confirmado pelo usuário em 2026-09-15. |
| Decision | Quando não houver relação ativa vigente, a ingestão salvará o record sem vínculo de blend e não retornará erro. | Confirmado pelo usuário em 2026-09-15. |
| Open decision | Um Sinter Feed pode ter mais de um blend para o mesmo fornecedor em períodos distintos? | Recomendação: sim, por versionamento com início/fim de vigência. |

## Domain

- Glossary and actors: Sinter Feed é a identificação recebida no carregamento; blend é a classificação configurada para combinação de fornecedor e Sinter Feed; cliente é o usuário autenticado que administra os cadastros.
- State/lifecycle changes: o cliente cadastra Sinter Feeds e blends, cria relações por fornecedor e as ativa, encerra ou substitui; a ingestão vincula o record à relação ativa que corresponde ao fornecedor e ao Sinter Feed recebido.

### Domain rules

- DR-1: a ingestão técnica deve aceitar opcionalmente `nota.sinterFeed` com um identificador de até 120 caracteres.
- DR-2: cada Sinter Feed configurável deve ter identificador único, descrição opcional e indicador de ativo.
- DR-3: cada blend configurável deve ter código único, descrição opcional e indicador de ativo.
- DR-4: o cliente deve poder configurar uma relação entre fornecedor, Sinter Feed e blend, com período de vigência e indicador de ativo.
- DR-5: para cada record com fornecedor identificado e Sinter Feed informado, o sistema deve localizar a relação ativa vigente e vinculá-la ao record.
- DR-6: relações encerradas não devem ser alteradas para preservar a classificação histórica dos carregamentos já vinculados.
- DR-7: o sistema não deve pré-cadastrar relações, Sinter Feeds, blends ou fornecedores a partir do documento fornecido.

## Acceptance scenarios

### AC-1: carregamento com relação configurada

**Given** um fornecedor identificado, um Sinter Feed informado na nota e uma relação ativa vigente para o fornecedor e Sinter Feed

**When** o terminal cria o record

**Then** o record preserva o Sinter Feed recebido e é vinculado à relação, que aponta para o blend configurado.

### AC-2: carregamento sem Sinter Feed

**Given** um payload válido sem `nota.sinterFeed`

**When** o terminal cria o record

**Then** o record é salvo normalmente, sem vínculo de Sinter Feed ou blend.

### AC-3: configuração alterada para novos carregamentos

**Given** uma relação de fornecedor e Sinter Feed anteriormente utilizada por records

**When** o cliente a encerra e cria uma nova relação com outro blend

**Then** novos records usam a nova relação vigente

**And** records anteriores continuam associados à relação histórica original.

### AC-4: combinação sem configuração

**Given** um Sinter Feed informado, mas sem relação ativa vigente para o fornecedor

**When** o terminal cria o record

**Then** o record é salvo com o valor recebido, sem vínculo de configuração ou blend.

## Error, authorization, and edge cases

- A ingestão técnica continua protegida por `x-api-key`.
- As rotas de administração das configurações exigirão autenticação de usuário; autorização por papel não existe no projeto atual e deve ser definida antes de expor a edição ao cliente.
- Não pode haver duas relações ativas simultâneas para a mesma combinação de fornecedor e Sinter Feed cujas vigências se sobreponham.
- Um record sem fornecedor identificado não pode ser associado automaticamente a uma relação de fornecedor, mesmo se houver Sinter Feed.

## Technical decisions

| Decision | Chosen approach | Rationale | Consequence / migration |
|---|---|---|---|
| Campo de entrada | Proposto `nota.sinterFeed` opcional. | Agrupa o dado com os campos de nota já existentes. | Nova coluna `records.sinter_feed_value` para preservar o valor recebido. |
| Catálogo de feeds | Tabela `sinter_feeds`. | Evita valores livres como fonte de configuração. | CNPJ não pertence a este cadastro. |
| Catálogo de blends | Tabela `blends`. | Mantém blends independentes e reutilizáveis. | Código do blend único. |
| Relacionamento | Tabela `issuer_sinter_feed_mappings` com `issuer_id`, `sinter_feed_id`, `blend_id`, `starts_at`, `ends_at`, `is_active`; há no máximo uma relação ativa por fornecedor e feed. | Permite administrar e versionar classificação sem reescrever o histórico. | `records` recebe `issuer_sinter_feed_mapping_id` anulável; encerrar uma relação é necessário antes de criar a próxima. |
| Administração | CRUD autenticado para os três cadastros, sem semeadura automática. | O cliente controla todas as alterações. | Definir política de permissão antes de disponibilizar edição. |

## Implementation and verification plan

1. Confirmar o campo de entrada e o comportamento para combinação não configurada.
2. Criar migrations para catálogos, relacionamento versionado e referências em records.
3. Atualizar a validação e a ingestão para preservar o Sinter Feed e resolver a relação quando possível.
4. Implementar endpoints autenticados de administração e validar que relações históricas não podem ser sobrescritas.
5. Atualizar OpenAPI e executar cenários AC-1 a AC-4.

## Risks, rollout, and deferred work

- O modelo proposto exige que o fornecedor seja identificado pela chave da nota antes de encontrar a relação automática.
- Dados enviados antes da configuração não serão classificados retroativamente neste escopo.
- Relatórios e dashboards de blend são deliberadamente adiados.
