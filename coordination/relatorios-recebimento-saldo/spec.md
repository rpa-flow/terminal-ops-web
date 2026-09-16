# Especificação — dashboards TBJC de recebimento e saldo por Blend

## Objetivo e limites

- **Objetivo:** disponibilizar, exclusivamente na área autenticada de Relatórios TBJC, dois dashboards operacionais: quantidade recebida por dia e saldo atualizado diário por Blend.
- **Em escopo:** filtros de período do relatório TBJC, agregação de pesos recebidos, agrupamento por dia e Sinter Feed/Blend, embarques, tabela-resumo e gráficos acessíveis.
- **Fora de escopo:** relatórios TCS, alteração dos processos de importação/recebimento, recálculo de dados históricos, exportação e novos cadastros de Sinter Feed ou Blend.
- **Fonte / aprovação:** solicitação do usuário e imagem de referência de 15/09/2026; implementação aprovada em 16/09/2026.

## Fatos observados e decisões em aberto

| Tipo | Item | Evidência ou decisão necessária |
|---|---|---|
| Fato observado | `GET /reports/overview` já aceita período e retorna `dailyReceivedWeights` e `pileBalances`. | `api/src/services/report.service.ts` |
| Fato observado | Para TBJC, recebimentos vêm de `records.recebimento_peso`; o registro já referencia `issuer_sinter_feed_mappings`, que por sua vez referencia Sinter Feed e Blend. Embarques possuem `volume`, mas não possuem Blend persistido. | `api/prisma/schema.prisma` |
| Fato observado | O peso recebido é texto e hoje é normalizado para número no serviço. | `parseWeight` em `report.service.ts` |
| Fato observado | O dashboard atual é agregado por dia e o saldo por pilha considera somente o intervalo filtrado. | `dailyReceivedWeights` e `buildPileBalances` |
| Decisão aprovada | A coluna `SF M01…M17` representa o Sinter Feed. | Resposta do usuário em 16/09/2026. |
| Decisão aprovada | O saldo considera somente a data/período filtrado. | Resposta do usuário em 16/09/2026. |
| Decisão aprovada | No lançamento de embarque, o usuário selecionará obrigatoriamente o Blend. | Resposta do usuário em 16/09/2026; requer alteração no cadastro e persistência do embarque. |
| Decisão aprovada | A unidade exibida é tonelada. Registros sem peso, com peso inválido ou sem Sinter Feed não entram nos totais e são exibidos em um contador “Não classificados”. | Resposta do usuário em 16/09/2026. |
| Decisão aprovada | Os agrupamentos diários usam o fuso operacional `America/Sao_Paulo`. | Resposta do usuário em 16/09/2026. |

## Domínio

- **Recebimento:** registro TBJC com peso de recebimento preenchido; sua data operacional é `dataHora`.
- **Embarque:** lançamento TBJC com data `shippedAt`, volume decimal e Blend obrigatório após a mudança.
- **Sinter Feed (SF):** categoria operacional exibida como `SF M01…M17` no dashboard de recebimentos.
- **Blend:** categoria obrigatoriamente selecionada no embarque e usada para consolidar seu saldo no período filtrado.
- **Data operacional:** dia em que o recebimento/embarque integra o dashboard; não é a data de importação quando a data operacional existir.

### Regras de domínio

- **DR-1:** somente dados TBJC e autenticados participam dos dois dashboards; nenhuma informação de notas/TCS participa do cálculo.
- **DR-2:** cada recebimento com peso válido integra exatamente um dia operacional e um Sinter Feed; registros sem essa classificação não podem ser atribuídos silenciosamente a um SF válido.
- **DR-3:** o dashboard “Quantidade recebida por dia” deve apresentar, para cada dia do período, o peso recebido por Sinter Feed e o total do dia; dias sem recebimento permanecem visíveis com zero.
- **DR-4:** o embarque deve exigir a seleção de um Blend e persistir essa escolha junto ao lançamento; embarques sem Blend não podem ser gravados após a mudança.
- **DR-5:** para cada Blend, o saldo no período filtrado deve ser calculado como `recebido no período - embarcado no período`, na mesma unidade e com três casas decimais internamente.
- **DR-6:** o dashboard “Saldo atualizado por Blend — diário” deve apresentar os valores de cada Blend e o total consolidado, com o período aplicado de forma inequívoca.
- **DR-7:** entradas com peso ausente ou inválido, e recebimentos sem Sinter Feed, não entram nos totais; a API deve retornar seu quantitativo e a interface deve exibí-lo como contador “Não classificados”.
- **DR-8:** a API continua a validar data inicial menor ou igual à final e limita a série diária a, no máximo, 366 dias, preservando o contrato de autenticação.

## Cenários de aceitação

### AC-1: recebimentos diários por categoria

**Dado** um período selecionado contendo registros TBJC classificados por Sinter Feed

**Quando** o operador atualizar o relatório

**Então** o painel deve mostrar uma série diária com uma barra/valor por categoria, inclusive zero quando não houve recebimento

**E** a soma das categorias deve ser igual ao total recebido do dia.

### AC-2: saldo diário por Blend

**Dado** recebimentos e embarques atribuídos ao mesmo Blend no período filtrado

**Quando** o operador consultar o dashboard de saldo

**Então** a tabela e o gráfico devem mostrar `recebido no período - embarcado no período` para cada Blend

**E** o total deve ser a soma dos saldos das categorias exibidas.

### AC-3: ausência de movimento

**Dado** um dia ou categoria sem recebimento e sem embarque no intervalo aplicável

**Quando** o relatório for exibido

**Então** o valor deve ser zero, sem omitir o dia da série nem indicar dado inexistente como saldo desconhecido.

### AC-4: dados incompletos

**Dado** um recebimento sem Sinter Feed ou sem dado válido para classificação

**Quando** o relatório for calculado

**Então** ele não deve compor um SF ou Blend válido

**E** a interface deve exibir seu quantitativo no contador “Não classificados”.

## Erros, autorização e casos extremos

- O endpoint permanece protegido por autenticação.
- Datas inválidas, período invertido e consultas acima do limite atual retornam a validação já adotada pela API.
- A conversão de peso deve aceitar os formatos históricos atuais e rejeitar/segregar valores que não resultem em número finito.
- Os agrupamentos diários usam `America/Sao_Paulo`; a conversão deve ocorrer antes de obter a chave de data.
- Não haverá valor negativo bloqueado: saldo negativo deve ser mostrado como resultado operacional e, se solicitado, destacado visualmente.

## Decisões técnicas propostas

| Decisão | Abordagem proposta | Justificativa | Consequência / migração |
|---|---|---|---|
| Contrato | Estender a resposta de `/reports/overview` com estruturas específicas, sem remover os campos existentes. | Evita quebra da tela atual. | Atualizar tipos do web e testes de serviço. |
| Agregação diária | Retornar `{ date, totalsByCategory, totalWeight }`, com todas as datas do período. | Permite reproduzir o primeiro gráfico e uma tabela acessível. | Nenhuma migração. |
| Classificação e saldo | Retornar recebimento diário por Sinter Feed e saldo por Blend, incluindo recebido e embarcado no período para auditoria. | Corresponde às duas dimensões aprovadas e permite conferir a fórmula. | Exige persistir `blendId` no embarque; o recebimento TBJC já alcança o Blend via `issuerSinterFeedMapping`. |
| Visual | Manter gráficos SVG atuais, com tabela resumida equivalente, rótulos `pt-BR` e alternativa textual. | Reaproveita o padrão do projeto e preserva acessibilidade. | Alteração localizada em `ReportsPage.tsx`. |
| Qualidade de dados | Expor contador de “Não classificados” para registros excluídos por peso ausente/inválido ou SF ausente. | Não mascara inconsistências históricas. | Pode exigir ajuste do cadastro/processo de origem. |

## Plano de implementação e verificação

1. Estender o lançamento de embarque TBJC com seleção obrigatória e persistência do Blend, com migração que proteja os lançamentos existentes.
2. Criar no serviço de relatórios TBJC as agregações diárias por Sinter Feed e o saldo por Blend no período filtrado, usando o Blend de `issuerSinterFeedMapping` nos recebimentos e a seleção persistida nos embarques.
3. Estender o contrato/tipos do endpoint de modo compatível e criar testes unitários para DR-2 a DR-8, incluindo dia sem movimento, peso brasileiro, não classificado e saldo negativo.
4. Substituir/complementar os cards da página TBJC pelos dois painéis: gráfico e tabela de quantidade diária por SF; tabela e gráfico de saldo por Blend com total e período aplicado.
5. Validar AC-1 a AC-4 contra uma massa controlada, executar a verificação de API relevante e `npm run build` em `api`; executar `npm run lint` e `npm run build` em `web`, registrando limites de ambiente separadamente.

## Riscos, entrega gradual e itens adiados

- O principal risco é existirem registros TBJC legados sem `issuerSinterFeedMapping`; eles devem seguir a regra aprovada de “Não classificados”.
- O saldo é do período filtrado; a interface deve exibir a janela aplicada no painel.
- O banco armazena alguns pesos como texto; inconsistências históricas devem ser contabilizadas para auditoria, não corrigidas pelo relatório.
- Exportação, persistência de snapshots diários e comparação com estoque físico ficam adiados.
