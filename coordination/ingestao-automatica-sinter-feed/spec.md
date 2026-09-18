# Cadastro automático de Sinter Feed na ingestão specification

## Goal and boundaries

- Goal: cadastrar automaticamente no catálogo o Sinter Feed recebido em `nota.sinterFeed` quando o código ainda não existir.
- In scope: ingestão individual de records, criação idempotente do catálogo, preservação da resolução atual de classificação por fornecedor e retroclassificação ao criar uma relação.
- Out of scope: reativar Sinter Feeds inativos, criar Blends ou criar classificações automaticamente.
- Source / approval: solicitação explícita do usuário em 16/09/2026.

## Domain

- Sinter Feed: código informado pela fonte de ingestão, normalizado em maiúsculas antes de chegar ao repositório.

### Domain rules

- DR-1: Ao ingerir um record com `sinterFeedValue`, o sistema deve garantir que exista um Sinter Feed com o mesmo código, criando-o ativo quando inexistente.
- DR-2: A criação deve ser idempotente e não pode alterar descrição ou estado de um Sinter Feed que já exista.
- DR-3: A ausência de chave de nota não impede o cadastro do Sinter Feed; apenas impede a associação automática ao fornecedor.
- DR-4: A classificação continua opcional e só é vinculada quando houver fornecedor e relação vigente já configurada.
- DR-5: Ao criar uma classificação, o sistema deve vinculá-la somente a records ainda sem classificação, do mesmo fornecedor e com o mesmo Sinter Feed.
- DR-6: A criação da classificação deve retornar a quantidade de records retroclassificados, sem carregar esses records no cliente.
- DR-7: Quando `nota.sinterFeed` contiver um sufixo entre colchetes, o sistema deve salvar e usar somente o texto anterior ao primeiro `[`.

## Acceptance scenarios

### AC-1: Novo código recebido

**Given** uma requisição de ingestão com `nota.sinterFeed` válido e sem catálogo correspondente

**When** o record for ingerido

**Then** um Sinter Feed ativo é criado com o código normalizado e o record é salvo.

### AC-2: Código já cadastrado

**Given** uma requisição de ingestão com um Sinter Feed já existente

**When** o record for ingerido

**Then** o catálogo existente não é alterado e o record é salvo.

### AC-3: Sem chave de nota

**Given** uma requisição de ingestão sem chave de nota e com Sinter Feed

**When** o record for ingerido

**Then** o Sinter Feed é cadastrado, sem criar fornecedor ou classificação.

### AC-4: Retroclassificar records em branco

**Given** records sem classificação para o mesmo fornecedor e Sinter Feed

**When** uma classificação por fornecedor for criada

**Then** os records recebem o identificador da nova classificação e a resposta informa a quantidade atualizada.

**And** records de outro fornecedor, outro Sinter Feed ou já classificados não são alterados.

### AC-5: Sinter Feed com NCM no sufixo

**Given** uma requisição com `nota.sinterFeed` igual a `MINERIO DE FERRO SINTER FEED M09 [NCM:26-01.11.00]`

**When** o record for ingerido

**Then** o record, o catálogo e a busca da classificação usam `MINERIO DE FERRO SINTER FEED M09`.

## Technical decisions

| Decision | Chosen approach | Rationale | Consequence |
|---|---|---|---|
| Idempotência | `upsert` por `code` dentro da transação de ingestão. | Replica o padrão de fornecedores e evita duplicação concorrente. | Sem migração. |
| Estado existente | `update: {}`. | Um item inativo não é reativado silenciosamente por dados externos. | Configuração continua sob controle operacional. |
| Retroclassificação | `updateMany` filtrado por `issuerId`, `sinterFeedValue` e identificador de classificação nulo. | Atualiza no banco em uma única operação, sem transferir records para a tela. | Preserva vínculos históricos já gravados. |
| Normalização do Feed | Remover o conteúdo a partir do primeiro `[` e aplicar trim/maiúsculas. | NCM e outros metadados no sufixo não devem criar feeds distintos. | A chave do catálogo e das classificações fica estável. |

## Implementation and verification plan

1. Criar/upsertar o catálogo antes da tentativa de classificação.
2. Ao criar uma classificação, executar retroclassificação com `updateMany` e retornar a contagem.
3. Executar validação de API/frontend contra DR-1 a DR-7.
