# Configurações de cadastros e classificações specification

## Goal and boundaries

- Goal: tornar os cadastros de fornecedores, Sinter Feed e Blends facilmente encontráveis e separar a manutenção dos catálogos da classificação por vigência.
- In scope: navegação do frontend, rotas de configuração, textos e telas de Fornecedores, Sinter Feed, Blends e Classificações por fornecedor.
- Out of scope: alterar APIs, permissões, criação automática de fornecedores e regras de persistência/vigência.
- Source / approval: avaliação de produto e design aprovada pelo usuário em 16/09/2026; usuário definiu o nome de negócio como "Fornecedores".

## Observed facts and open decisions

| Type | Item | Evidence or decision needed |
|---|---|---|
| Observed fact | Fornecedores são identificados pela ingestão de notas e apenas a descrição é editável. | `IssuersPage.tsx` e API existente |
| Observed fact | Sinter Feed, Blends e a regra de vigência estão na mesma tela. | `SinterFeedsPage.tsx` |
| Assumption | Todos os usuários autenticados que já acessam as rotas atuais podem acessar os novos destinos. | Não há regra de perfis no frontend atual |

## Domain

- Glossary and actors: Fornecedor é o emissor identificado automaticamente; Sinter Feed e Blend são catálogos; Classificação por fornecedor associa fornecedor, feed, blend e vigência.

### Domain rules

- DR-1: A navegação principal deve expor Configurações com destinos independentes para Fornecedores, Sinter Feed, Blends e Classificações por fornecedor.
- DR-2: Fornecedores continuam automáticos; a tela permite somente consultar, buscar e complementar sua descrição operacional.
- DR-3: Cada catálogo deve ter sua própria tela, sem formulário ou lista do outro catálogo.
- DR-4: A tela de classificações deve administrar apenas associação, vigência e histórico, usando os mesmos contratos e restrições atuais.
- DR-5: A rota legada de emitentes deve permanecer utilizável, redirecionando para Fornecedores.

## Acceptance scenarios

### AC-1: Encontrar configurações

**Given** usuário autenticado em uma tela operacional

**When** abre Configurações

**Then** encontra Fornecedores, Sinter Feed, Blends e Classificações por fornecedor.

### AC-2: Manter fornecedor automático

**Given** usuário acessa Fornecedores

**When** a lista é carregada

**Then** vê a orientação de origem automática e pode editar somente a descrição operacional.

### AC-3: Manter catálogos isolados

**Given** usuário acessa Sinter Feed ou Blends

**When** cadastra, edita ou altera o estado de um item

**Then** visualiza somente o catálogo escolhido.

### AC-4: Classificar por vigência

**Given** existem fornecedor, Sinter Feed e Blend ativos

**When** usuário acessa Classificações por fornecedor e cria uma associação

**Then** a relação é salva pelos contratos existentes e o histórico permanece visível.

## Technical decisions

| Decision | Chosen approach | Rationale | Consequence / migration |
|---|---|---|---|
| Navegação | Estender a sidebar existente com o grupo Configurações. | Evita botões dispersos no cabeçalho e mantém acesso persistente. | Somente frontend. |
| Rotas | Criar rotas independentes e preservar `/emitentes` como redirecionamento. | URLs claras sem quebrar favoritos existentes. | Sem migração. |
| Reuso | Extrair manutenção de catálogo em componente compartilhado. | Mantém a separação visual sem duplicar contrato e comportamento. | Sem alteração de API. |

## Implementation and verification plan

1. Criar navegação e rotas de configurações independentes.
2. Separar catálogos e classificações em páginas próprias, preservando os serviços atuais.
3. Executar lint e build do frontend, depois validação independente dos DR/AC.

## Risks, rollout, and deferred work

- Encerramento retroativo de classificação e permissões por perfil permanecem fora de escopo; o comportamento existente será preservado.
