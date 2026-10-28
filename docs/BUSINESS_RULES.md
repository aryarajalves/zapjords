# 📋 Regras de Negócio e UX - ZapVoice

Este documento centraliza as definições de comportamento do sistema e os requisitos de interface para garantir uma experiência "Premium".

## 🛠️ Regras de Negócio Centrais

### 1. Gestão de Janela de 24h (Meta) e Deduplicação de Templates
- Mensagens de sessão (texto livre) só podem ser enviadas se o usuário interagiu nas últimas 24h.
- Fora dessa janela, apenas **Templates aprovados pela Meta** podem ser iniciados.
- O sistema deve validar automaticamente se o envio é permitido ou se deve usar um template.
- **Trava de Deduplicação de 24h para Templates (Bloqueio Total)**: Se um template foi enviado para o número sem erro nas últimas 24 horas (seja via Template Pago da Meta ou via Mensagem Livre/Smart Send com status `sent`, `delivered` ou `read`), o sistema bloqueia qualquer reenvio duplicado do mesmo template para aquele número pelo período de 24 horas (comparando DDD + número com 10 dígitos). Apenas erros de envio (`failed`) não bloqueiam o reenvio. Para forçar o reenvio antes das 24h, o usuário pode remover a trava na aba Contatos.

### 2. Fluxo de Webhooks e Automação
- **Slugs Customizados**: Cada integração possui uma URL única (ex: `/api/webhooks/venda-vip`).
- **Mapeamento de Eventos**: O usuário define qual Funil ou Template dispara para cada status (Boleto, Aprovado, Reembolso).
- **Filtro de Produtos**: Possibilidade de ignorar eventos de produtos que não estão na "White List".
- **Deduplicação e Validação de Reembolsos e Chargebacks**: Eventos de estorno (`reembolso` e `chargeback`) só são processados e contabilizados se o comprador possuir saldo de compra aprovada (`compra_aprovada`, `compra_aprovada_ob`, `compra_aprovada_com_ob`, `compra_aprovada_upsell`) ativa para o mesmo produto. Tanto no recebimento de webhooks quanto no cálculo do painel financeiro, o `chargeback` abate o faturamento líquido total e é listado na tabela de transações com o badge de estorno. Reenvios duplicados de reembolso/chargeback sem uma nova compra aprovada correspondente são automaticamente ignorados (`status="ignored"`, `reason="duplicate_refund_no_active_purchase"`), protegendo a integridade financeira das métricas.
- **Webhook de Memória em Disparos em Massa**: Quando o Webhook de Memória do Agente está configurado, o sistema envia automaticamente para essa URL todas as mensagens de disparos em massa (Bulk) que são de fato entregues (status delivered/read) no WhatsApp do contato.

### 3. Regras de Cancelamento e Interrupção Inteligente
- Se um novo evento chega para o mesmo contato (ex: "Compra Aprovada"), o sistema é capaz de cancelar execuções pendentes/enfileiradas de eventos anteriores configurados (ex: "Carrinho Abandonado", "Pix Gerado", "Cartão Recusado") respeitando o filtro de produto.
- **Bloqueio de 24h para Templates Cancelados**: Além de cancelar mensagens pendentes, a Interrupção Inteligente bloqueia os templates configurados nos gatilhos cancelados (principais e follow-up) para aquele contato específico pelo período de 24 horas (`ContactTemplateHistory`), impedindo que novos webhooks, funis ou disparos enviem esses templates para o contato durante essa janela.

### 4. Integração com Chatwoot (CRM)
- [x] **Fluxo de Sincronização de Notas/Etiquetas**:
    - **Delay Inteligente**: Aguardar 5 segundos apenas após a confirmação de que o template chegou ao WhatsApp do contato (uma única vez).
    - **Busca/Criação**: Localizar a última conversa ou criar uma nova se não existir.
    - **Gestão de Etiquetas**: Sempre adicionar novas etiquetas às existentes (modo Append), preservando o histórico do contato.
    - **Nota Privada**: Postar o conteúdo do disparo como Nota Privada se configurado na UI. *Nota: Para disparos em massa, nenhuma nota privada deve ser enviada (desativado completamente).*

### 5. Gestão de Blacklist e Retentativas
- **Isolamento de Blacklist**: A lista de contatos bloqueados é 100% isolada por cliente (`client_id`), sem compartilhamento global.
- **Política de Retentativa**: Em caso de falha temporária da Meta, o sistema deve tentar o reenvio **5 vezes**, com um intervalo de **5 segundos** entre cada tentativa.

### 6. Integração com ManyChat
- **Sincronização de Etiquetas**: 
    - O ZapVoice atua enviando etiquetas para o ManyChat.
    - **Fluxo**: Verificar se o contato existe (pelo número); se não, criar o contato com Nome e Número; verificar se a etiqueta existe; se não, criar a etiqueta antes de aplicá-la.

### 7. Performance e Filas
- **Prioridade**: O sistema utiliza uma fila única por tipo de processo (Bulk, Funnel, Webhook) sem priorização entre eventos de venda e marketing.

### 8. Hierarquia e Interação de Funis
- **Gatilho por Botão**: Todo clique em botão de template (independente se o envio foi via Disparo em Massa ou Integração Webhook) que corresponda a uma palavra-chave de um funil deve iniciar a automação correspondente.
- **Rastreamento de Interação**: O clique é detectado pelo handler de WhatsApp (Meta), que marca a mensagem como "Interagida" e incrementa o contador de **Interações (👆)** no disparo pai.
- **Processamento via Chatwoot**: Para garantir a estabilidade da conversa e a disponibilidade dos IDs (`conversation_id`, `account_id`), o disparo efetivo do funil filho é realizado pelo webhook de entrada do Chatwoot (`message_created`).
- **Delay de Segurança**: O sistema aplica um delay obrigatório de **7 segundos** (via Background Task) após o recebimento do webhook do Chatwoot antes de iniciar a execução do funil.
- **Vínculo Hierárquico (`parent_id`)**: O funil filho é criado vinculando o `trigger_id` do disparo original. 
- **UX no Histórico**: 
    - Funis filhos são ocultados da listagem principal para evitar poluição visual.
    - Eles são acessíveis exclusivamente através do botão **"Funis Ativados (🔄)"** presente na linha do disparo pai no histórico de disparos.

### 9. Calendário e Aba de Agendamentos (`schedules`)
- **Filtro de Visibilidade**: A aba/calendário de Agendamentos exibe **exclusivamente** os disparos em massa agendados e os agendamentos diretos de funis principais criados pelo usuário.
- **Ocultação de Nós de Delay de Funil**: Execuções individuais de contatos navegando em nós de delay dentro de um funil (`current_node_id`, `contact_phone`, `parent_id` ou `HIDDEN_CHILD`) **não são exibidas no calendário de agendamentos** para evitar poluição visual e manter a clareza da agenda.

### 10. Unicidade do Gatilho de Nova Conversa no Chat
- **Regra de Exclusividade**: Apenas **1 único funil** por cliente (`client_id`) pode ter o gatilho `trigger_on_new_conversation = True` ativo simultaneamente.
- **Prevenção de Duplicações**: Para evitar conflitos de automação, disparos concorrentes ou loops de mensagens para o mesmo lead quando uma conversa nova for iniciada ou reaberta no Chat:
  - O painel do editor (`MetadataPanel`) desabilita a opção em outros funis e exibe aviso de bloqueio informando o nome do funil atualmente ativo.
  - A API (`routers/funnels.py`) valida e rejeita (`HTTP 400`) qualquer tentativa de criação ou atualização que tente ativar o gatilho caso outro funil já o detenha.

### 11. Limite de Caracteres no Nome de Etiquetas / Marcadores
- **Tamanho Máximo Rígido**: O tamanho máximo permitido para o nome de qualquer etiqueta ou marcador (tanto nas Etiquetas Internas ZapVoice quanto nas Etiquetas na Conversa / Chat Local) é de **25 caracteres**.
- **Consistência Ponta a Ponta**: A regra é aplicada de forma rígida no backend (validação com erro `400` para mais de 25 caracteres) e no frontend em todos os formulários e modais (contador visual `0/25 caracteres`, propriedade `maxLength={25}` e corte preventivo `.slice(0, 25)`).
  - Para transferir o gatilho para outro funil, o usuário deve primeiro desmarcar e salvar no funil atualmente ativo.

### 11. Notificação de Início de Funil e Visualização de Pipeline no Chat
- **Registro Automático na Conversa**: Sempre que um funil for iniciado para um contato (por Nova Conversa, Palavra-chave ou Disparo Manual), uma mensagem de sistema (`message_type='funnel_event'`) é criada na conversa com os metadados do disparo (`trigger_id`, `funnel_id`, `funnel_name`).
- **Botão "Ver Pipeline do Funil"**: A notificação no chat conta com um botão de ação rápida que abre o modal da Pipeline (`AutomationPipelineModal`), permitindo ao operador auditar visualmente a árvore de execução, os nós processados e as etiquetas atribuídas ao lead.

### 12. Redisparo Imediato de Templates com Falha na Conversa
- **Identificação Visual de Falhas**: Se a Meta rejeitar o envio do template ou reportar status `failed` (ex: serviço temporariamente indisponível), o balão da mensagem no chat exibe o alerta de erro detalhado.
- **Botão "▶ Disparar Novamente"**: Disponibiliza um botão de reenvio com feedback em tempo real. O backend limpa o histórico restritivo de 24 horas para aquele template e contato e realiza uma nova tentativa de envio via Meta API, atualizando o status da mensagem sem necessidade de recarregar a tela.

### 13. Distinção entre Segmentação Local (Leads) e Atendimento (Chat)
- **Segmentação Local (ZapVoice)**: Atua exclusivamente sobre o banco de contatos e leads do ZapVoice (`WebhookLead`). É utilizada para adicionar/remover tags de segmentação de contatos (usadas para filtros, listas e disparos em massa) ou gerenciar a Blacklist local (bloquear/desbloquear número). **Não altera marcadores/etiquetas da conversa no Chat.**
- **Atendimento (Chat Local)**: Opção específica para o módulo de Atendimento/Chat. É a responsável por adicionar e remover etiquetas/marcadores diretamente na conversa do contato (`ChatConversation.labels`), além de permitir atualizar nome, notas privadas e responsável da conversa no Chat local.
- **Etiquetas do Contato em Disparo em Massa (`contact_labels`)**:
  - No módulo de Disparo em Massa, o usuário tem a opção de definir etiquetas para serem atribuídas **diretamente no contato** (`WebhookLead.tags` e entidade de contato do Chatwoot) que recebeu o disparo.
  - **Isolamento de Escopo Estrito**: As etiquetas do contato são aplicadas exclusivamente ao cadastro do lead/contato. Elas **NUNCA** são aplicadas na conversa (`ChatConversation.labels` ou marcadores de conversa), preservando o histórico de atendimento do chat e garantindo segmentação correta na base de contatos e pipelines do CRM.
  - **Limite de Caracteres**: Cada etiqueta inserida respeita o teto máximo de 25 caracteres.

### 14. Política de Cobrança e Franquia da Meta Cloud API (Vigência 01/10/2026)
- **Franquia de 1.000 Mensagens Gratuitas de Serviço**: Cada cliente/número possui uma cota mensal de 1.000 mensagens de serviço (atendimento SAC/chat livre) gratuitas. A contagem zera no primeiro dia de cada mês.
- **Tarifação após a Cota**:
  - Mensagens de serviço excedentes: **R$ 0,0350 por mensagem entregue**.
  - Templates de utilidade/transacionais: **R$ 0,0350 por template**.
  - Templates de marketing/promocionais: **R$ 0,3500 por template**.
- **Painel Financeiro de Disparos**: Apresenta em tempo real a barra de consumo da franquia, a fatura acumulada e a projeção de fechamento no fim do mês.

### 15. Filtros Dinâmicos de Público Alvo em Disparos Recorrentes (Interação e Criação)
- **Segmentação por Última Interação (`interaction_filter_days`)**: Permite filtrar o público do disparo recorrente para considerar apenas contatos que interagiram (enviaram mensagem no WhatsApp/Chat local, registrado via `ChatConversation.last_contact_message_at`) nos últimos **7, 14, 30, 60 ou 90 dias** (ou Sem Filtro/Todos). Contatos sem interação nesse período são desconsiderados do disparo.
- **Segmentação por Data de Criação (`created_filter_days`)**: Permite filtrar o público do disparo recorrente para considerar apenas contatos cadastrados no sistema (via `WebhookLead.created_at` ou `ChatConversation.created_at`) nos últimos **7, 14, 30, 60 ou 90 dias** (ou Sem Filtro/Todos).
- **Combinação e Preservação de Exclusões**: Os filtros de interação e criação podem ser combinados livremente. A lista manual de exclusões (`exclusion_list`) continua soberana e exclui qualquer contato explicitamente removido pelo usuário, independentemente de seus dados de interação ou data de criação. Tanto no disparo manual (`POST /recurring/{id}/trigger`) quanto na rotina automática do scheduler (`recurring_processor.py`), esses filtros são aplicados dinamicamente em tempo de execução.

### 16. Kanban de Vendas / CRM Multi-Produto
- **Propósito**: Gestão visual e interativa do funil de oportunidades de vendas 100% no modelo Kanban com drag & drop.
- **Múltiplos Pipelines por Produto**: Cada pipeline de vendas é focado em um produto específico da operação (ex: *Mentoria Elite*, *Curso High Ticket*), permitindo etapas e métricas exclusivas por produto.
- **Origem Automática dos Cards (Deals)**:
  - **Webhooks de Plataformas (Kiwify, Hotmart, Eduzz, etc.)**: Eventos de vendas que trazem o nome do produto criam/atualizam automaticamente o deal no pipeline correspondente (ex: Carrinho Abandonado na coluna inicial, Compra Aprovada na coluna de Ganho/Venda Fechada).
  - **Etiquetas Vinculadas (`associated_tags`)**: Cada pipeline pode ter uma lista de etiquetas associadas. Ao aplicar uma dessas etiquetas no contato (seja no Chat ou via Funil), o contato é inserido automaticamente no pipeline do produto.
  - **Ação Rápida no Chat (Opção B3)**: No cabeçalho da conversa ativa no Chat local (botão dedicado com ícone do Kanban `FiTrello`) e na barra lateral de contato, o operador pode clicar para gerenciar a oportunidade:
    - Se o contato já possui um deal ativo no pipeline (`GET /api/crm/deals/by-phone/{phone}`), o modal exibe a **Etapa Atual** em um badge informativo e pré-seleciona a **Próxima Etapa** em ordem sequencial do pipeline, permitindo também mover livremente para qualquer outra coluna.
    - Permite selecionar o produto oficial do catálogo (`crm_products`) e preenche o valor em R$ automaticamente (com campo aberto para valor real com desconto).
    - Se a etapa selecionada for do tipo `lost` (Desistência/Perdido), exibe obrigatoriamente o campo de **Motivo da Desistência** (`lost_reason`) com alerta visual.
    - Ao salvar (`POST /api/crm/deals/move-contact`), a oportunidade é atualizada/criada com os status adequados (`won`, `lost`, `open`), produto, valor e notas.
  - **Sincronização Retroativa de Histórico**: Ao criar o pipeline ou clicar em "Sincronizar Histórico", o sistema busca leads passados daquele produto no banco (`WebhookLead`) e organiza nos estágios correspondentes.
- **Ações Rápidas no Card**: Cada card permite abrir a conversa no Chat local do WhatsApp com 1 clique, ou disparar templates/funis sem sair do Kanban.
- **Identificação do Canal de Origem no Card (`channel`)**: Cada contato no Kanban exibe um badge visual indicando de onde veio o lead (Kiwify, Hotmart, Eduzz, Checkout Jords, Bússola Quiz, YayForms, Elementor, WhatsApp, Instagram, etc.). O canal é herdado automaticamente do webhook ou pode ser definido/editado livremente no modal de oportunidade.
- **Criação e Gestão Dinâmica de Colunas / Estágios (`sales_pipeline_stages`)**: O operador pode criar novas colunas personalizadas no CRM via botão "+ Nova Coluna" (no cabeçalho ou ao final da fila horizontal), configurando nome, paleta de cores (Azul, Âmbar, Esmeralda, Rosa, Roxo, Ardósia, Índigo, Ciano), tipo de estágio (Em Andamento, Inicial, Ganho, Perdido) e gatilho automático opcional de webhook. Ao excluir uma coluna, seus cards são preservados e migrados automaticamente para outra etapa do pipeline.
- **Exclusão de Pipelines de Venda**: O operador pode excluir pipelines tanto através do ícone de lixeira no cabeçalho ao lado do seletor quanto pelo botão dedicado "Excluir Pipeline" no rodapé do modal de edição. A ação exige confirmação em modal centralizado com backdrop preto e proteção contra clique acidental. Ao excluir, as colunas e oportunidades vinculadas são removidas em cascata, e caso o pipeline removido fosse o padrão (`is_default`), o sistema elege automaticamente outro pipeline existente como padrão.
- **Vínculo de Produtos no Pipeline via Dropdown**: No modal de criação e edição de pipeline (`PipelineModal`), o campo de produto é um seletor dropdown conectado diretamente ao catálogo de produtos da empresa (`CRMProduct`), substituindo a digitação manual de texto. Ao escolher um produto cadastrado, o sistema sugere automaticamente o preço de tabela como Valor Padrão de Venda.
- **Colunas Padrão do Pipeline**: Por padrão, pipelines recém-criados são inicializados com as colunas: `Prospect`, `Lead`, `Oportunidade`, `Venda` (tipo 'won') e `Desistência` (tipo 'lost').
- **Motivo de Desistência Obrigatório no Card e Modal (`lost_reason`)**: Ao mover qualquer lead para a etapa de Desistência (via drag & drop ou seleção no modal), o sistema abre modal centralizado exigindo o motivo da desistência. O motivo é exibido com badge de destaque no card e no modal de edição do lead.
- **Catálogo de Produtos e Precificação Base (`crm_products`)**: Módulo dedicado para cadastrar os produtos da empresa com nome e valor oficial em R$. No card do Kanban, o nome do lead e o valor do produto aparecem de imediato no topo. Ao selecionar o produto no modal do lead, o valor base é preenchido automaticamente, mantendo campo para valor real negociado com desconto.
- **Taxa de Conversão e Métricas do Funil**:
  - **Card de Taxa de Conversão (%)**: O cabeçalho exibe card dinâmico com a taxa de conversão geral `(total_won_deals / total_deals) * 100`, arredondada para até 2 casas decimais, acompanhada da relação `X de Y convertidos`.
  - **Barra de Progresso do Funil (Pipeline Funnel)**: Barra visual horizontal dividida proporcionalmente pelas fatias de cada etapa do funil (com cores correspondentes) e legendas inferiores exibindo a porcentagem e total de leads em cada estágio.
  - **Porcentagem em Cada Coluna**: Os cabeçalhos de cada coluna exibem a contagem e a proporção percentual sobre o total do pipeline (ex: `255 (97.3%)` no badge e `Total da Etapa (97.3%): R$ X,XX`).
- **Otimização de Altura Vertical e Modo Foco no Kanban**:
  - **Eliminação de Títulos Redundantes**: O container superior (`AppContentHeader`) é omitido exclusivamente na visão do Kanban para evitar duplicidade de título e margens vazias.
  - **Extensão Total até o Rodapé da Janela**: O layout do Kanban passa a preencher 100% da altura da janela (`h-full min-h-0`), sem travas artificiais de altura fixa, permitindo que as colunas desçam até a base da tela.
  - **Alternância de Visualização ("Recolher Métricas / Ver Métricas")**: Botão no cabeçalho permite alternar o Modo Foco. Ao recolher as métricas numéricas, mais de 120px de espaço vertical são liberados imediatamente, permitindo que a visualização dos cards seja contínua e minimize a rolagem interna nas colunas. A preferência é memorizada no navegador (`kanban_show_metrics`).

- **Remoção Individual e em Massa de Oportunidades no Kanban**:
  - **Remoção Individual Direta**: Cada card do Kanban conta com um botão direto de lixeira no rodapé (ao lado do atalho de chat). Ao clicar, abre obrigatoriamente popup de confirmação centralizado (`DeleteConfirmModal`) para evitar exclusões acidentais.
  - **Seleção Múltipla e Remoção em Massa**: Cada card possui um checkbox no topo. Ao marcar 1 ou mais cards, uma barra de ações em massa flutuante (`BulkActionsBar`) é exibida com a contagem de selecionados, atalhos de "Selecionar Todos" / "Desmarcar Todos" e botão "Remover Selecionados". A exclusão em massa executa via `POST /api/crm/deals/bulk-delete`, garantindo isolamento por cliente (`client_id`) e confirmação centralizada.
- **Edição em Massa de Produto e Preço no Kanban (`BulkEditDealsModal`)**:
  - **Operação Controlada**: A barra de ações em massa disponibiliza o botão "Editar Produto e Preço". O modal permite atualizar de forma combinada ou independente:
    - **Produto de Interesse**: Permite selecionar um produto do catálogo oficial (`crm_products`), digitar produto avulso ou manter o produto original de cada lead.
    - **Preço / Valor Real (R$)**: Permite definir um novo valor numérico para todas as oportunidades selecionadas, com botão de 1 clique para sincronizar com o preço oficial de tabela do produto escolhido.
  - A API (`POST /api/crm/deals/bulk-update`) altera estritamente os campos marcados pelo usuário (`update_product`, `update_value`), preservando etapas, dados do lead e notas originais.

---

## 🖥️ Detalhamento das Telas e UX

Abaixo, detalho cada tela identificada no sistema e as dúvidas que precisamos sanar para levar a interface ao próximo nível.

### 1. Dashboard / Disparo em Massa (`bulk_sender`)
- **Propósito**: Realizar envios rápidos de templates para listas de contatos.
- **Funcionalidades**: Upload de CSV/Excel, seleção de template, mapeamento de variáveis, deduplicação preventiva.
- **Deduplicação Preventiva de Contatos**: Ao carregar lista via planilha (CSV/XLSX), entrada manual ou API de agendamento/reserva (`/bulk-send/schedule`, `/bulk-send/reserve`), o sistema normaliza os números telefônicos (DDI 55 + DDD + 9 dígitos) e elimina contatos duplicados antes do disparo. O usuário é notificado via toast no formato: `"Lista carregada: X linhas processadas (Y contatos únicos, Z duplicados descartados)"`. O total gravado no backend (`total_contacts`) reflete estritamente os contatos únicos, garantindo que o disparo conclua com 100% de progresso e `Restam 0`.
- **Dúvidas UI/UX**:
    - [x] Como deve ser o feedback visual durante um disparo de 10.000 contatos?
        - **Resposta**: O usuário é redirecionado para a tela de Histórico, onde acompanha o progresso em tempo real.
    - [x] Devemos permitir o agendamento direto nesta tela ou apenas disparo imediato?
        - **Resposta**: O agendamento já existe ao final da tela de disparo em massa, além da tela específica para disparos recorrentes.

### 2. Editor de Funis (`VisualFlowBuilder`)
- **Propósito**: Construir réguas de automação visualmente.
- **Funcionalidades**: Drag-and-drop de blocos de Mensagem, Áudio, Imagem, Vídeo, Delays e Nós de Integração/CRM.
- **Nó "Kanban de Vendas" (`kanbanNode`)**:
  - Localizado na categoria **"INTEGRAÇÕES"** do menu de adicionar nós.
  - Permite direcionar o contato automaticamente para uma etapa específica do CRM / Kanban durante a execução do funil.
  - **Campos configuráveis**:
    - **Pipeline de Vendas**: Seleção do pipeline desejado.
    - **Coluna de Destino**: Seleção dinâmica das etapas/colunas do pipeline.
    - **Produto de Interesse (Opcional)**: Seleciona um produto do catálogo oficial, preenchendo o valor base automaticamente.
    - **Valor Estimado (R$)**: Permite definir ou ajustar o valor da oportunidade em reais.
    - **Motivo da Desistência (`lost_reason`)**: Exibido dinamicamente apenas quando a coluna de destino selecionada for do tipo `lost` (ex: Desistência / Perdido).
  - **Comportamento no Motor de Execução**: Se o contato já possuir um deal no pipeline, move o lead para a nova coluna, atualiza status (`open`, `won` ou `lost`), atualiza o valor se informado e registra o motivo de desistência se for etapa de perda. Caso o deal ainda não exista, cria uma nova oportunidade automaticamente no pipeline e estágio especificados.
- **Dúvidas UI/UX**:
    - [x] O editor deve ter um modo "Auto-Layout" para organizar os blocos sozinhos ou o usuário deve ter controle total da posição?
        - **Resposta**: Controle manual. O formato atual está funcionando bem.
    - [x] Existe a necessidade de blocos condicionais (ex: SE tem a etiqueta X, ENTÃO vá para o passo Y)?
        - **Resposta**: Por enquanto não. A estrutura atual já é suficiente para as necessidades do projeto.

### 3. Integrações Webhook (`integrations`)
- **Propósito**: Configurar o recebimento de dados de plataformas externas.
- **Dúvidas UI/UX**:
    - [x] Devemos ter um "Testador de Webhook" integrado que simula um payload para validar se o funil dispara corretamente?
        - **Resposta**: Já existe um botão "Testar" que cumpre essa função.
- **Integração ZapGroup (Extração de Leads e Votos em Enquetes)**:
    - O payload enviado pelo ZapGroup possui suporte a dois eventos principais: `lead_extraido` (quando um participante é extraído) e `voto_enquete` (quando um participante vota em uma enquete do grupo).
    - O campo `grupo` (objeto ou string) é mapeado como `product_name` (nome do grupo no WhatsApp).
    - No evento `voto_enquete`, o sistema extrai e disponibiliza as variáveis personalizadas `titulo_enquete`, `opcao_marcada` e `opcoes_marcadas` para serem usadas nos templates e funis de disparo.
- **Integração Landing Page - Bussola Quiz (origem: `quiz_bussola` / `bussola_quiz`)**:
    - O payload enviado pela Landing Page do Quiz Bússola suporta o evento principal `leitura_concluida` (quando a leitura astrológica é concluída pelo lead), além de compatibilidade com `checkout_pre_populado`, `compra_aprovada` e `carrinho_abandonado`.
    - O campo `quiz.area` ou `produto` é mapeado automaticamente como `product_name` (ex: "Bússola Astrológica - Dinheiro").
    - Extrai e disponibiliza variáveis nativas para serem usadas nos templates, mensagens e nós de funis:
        - `{{mensagem}}`: Leitura astrológica completa e formatada para o WhatsApp
        - `{{leitura_id}}`: Identificador único da leitura
        - `{{nome_completo}}` e `{{first_name}}`: Nome e primeiro nome do lead
        - `{{nascimento_data}}`, `{{nascimento_hora}}`, `{{nascimento_completo}}`: Dados de nascimento estruturados
        - `{{cidade}}`, `{{cidade_nome}}`, `{{cidade_uf}}`: Localização do lead
        - `{{quiz_area}}`, `{{quiz_espelho}}`, `{{quiz_quebra}}`: Dados das respostas do quiz
        - `{{carta_titulo}}`, `{{carta_destaque}}`: Dados da carta sorteada
    - **Geração Automática de PDF da Leitura Astrológica (Gatilho)**:
        - No editor de gatilho de integrações do tipo `bussola_quiz`, é disponibilizada a opção/switch "Gerar PDF da Leitura Astrológica".
        - O PDF é gerado a partir do texto integral da `mensagem` vinda no JSON do webhook, convertendo negritos do WhatsApp (`*texto*` -> negrito) e quebras de linha (`\n` -> `<br/>`), com sanitização de caracteres/emojis para evitar falhas de codificação.
        - **Padrão Estético do PDF**: Formato A4, design minimalista/clean com fundo branco, cabeçalho sutil (Título "Leitura - Bússola Astrológica", Nome do Lead, Data de Nascimento), divisória elegante, corpo do texto justificado/legível e rodapé com paginação contínua ("Bússola Astrológica • Página X de Y").
        - **Nome do Arquivo**: `Leitura_Bussola_{Primeiro_Nome}.pdf` (ou `Leitura_Bussola.pdf` como fallback).
        - **Entrega no WhatsApp**: O PDF gerado é enviado para o storage (MinIO/S3), injetando as variáveis `bussola_pdf_url` e `bussola_pdf_filename`. Pode ser anexado automaticamente ao cabeçalho tipo Documento (`Header Document`) dos templates da Meta selecionando a opção nativa "PDF Automático da Leitura (Bússola Quiz)".
        - **Visualizador de Renderização de PDF**: O painel do gatilho e a coluna de prévia contam com botão "Visualizar PDF", abrindo um modal interativo com campos de simulação editáveis (Nome, Data e Mensagem), visualização em tempo real do PDF renderizado em A4 e botão de download.
- **Integração Formulário Personalizado (Formulários Online e Agendamento - origem: `formulario_personalizado`)**:
    - Suporta 3 tipos de eventos principais configuráveis para disparo de templates de WhatsApp independentes:
        - `formulario` (ou `form_submission`): envio inicial e preenchimento de formulário com perguntas/respostas (`answers`).
        - `booking_reminder_morning`: lembrete disparado na manhã do dia da reunião agendada (ex: às 09:00).
        - `booking_reminder_before_meeting`: lembrete disparado minutos antes da reunião agendada (ex: 30 minutos antes).
    - Para os lembretes de agendamento, extrai diretamente os campos da raiz do payload:
        - `contact_name` -> `name` e `first_name`
        - `contact_phone` -> `phone` e `whatsapp` (com normalização de DDD e DDI)
        - `contact_email` -> `email`
    - Variáveis de agendamento injetadas dinamicamente para os templates:
        - `{{formatted_datetime}}` e `{{data_reuniao}}`: Data e horário formatados da reunião agendada (ex: "30/10/26 19:00")
        - `{{scheduled_for}}`: Horário programado para o envio do lembrete (ex: "30/10/2026 09:00" ou "18:30")
        - `{{reminder_label}}`: Rótulo descritivo do lembrete (ex: "Lembrete 30 minutos antes da reunião")
        - `{{minutes_before}}`: Quantidade de minutos antes da reunião (ex: "30")
        - `{{scheduled_datetime}}`: Data e hora da reunião no formato ISO
        - `{{form_id}}`, `{{form_slug}}`, `{{form_title}}`, `{{response_id}}`: Metadados do formulário e resposta

- **Integração YayForms (Formulários Online - origem: `yayforms`)**:
    - O payload enviado pelo YayForms suporta o status/evento principal `formulario` (com compatibilidade e fallback para `form_submission`).
    - O sistema detecta automaticamente o nome do formulário/evento através de campos de cabeçalho (ex: "RETIRO CORAÇÃO CIGANO 2026") ou `formTitle`/`title`, mapeando-o como `product_name`.
    - Extração automática de dados fundamentais do lead:
        - `name`, `nome_completo` e `first_name`: capturados do campo de nome completo da resposta
        - `phone` e `whatsapp`: normalizados com DDI e DDD
        - `email`: extraído da resposta de e-mail do lead
        - `cidade`, `estado`, `pais`: extraídos tanto de perguntas diretas de moradia/cidade quanto do bloco `geolocation`
    - Mapeamento dinâmico de respostas como variáveis utilizáveis nos templates de mensagem e funis:
        - `{{form_id}}` e `{{response_id}}`: IDs do formulário e da resposta
        - `{{cidade}}`, `{{estado}}`, `{{pais}}`: Localização
        - Slugs amigáveis gerados para cada pergunta do formulário (ex: `{{qual_area_da_sua_vida_mais_pede_transformacao_neste_momento}}`, `{{qual_faixa_representa_melhor_o_investimento}}`)
        - Aliases semânticos automáticos: `{{investimento}}`, `{{area_transformacao}}`, `{{mudanca_concreta}}`, `{{experiencia_medicinas}}`, `{{interesse_consagrar}}`, `{{disponibilidade}}`, `{{saude_historico}}`, `{{momento_avancar}}`.

### 4. Gestão de Leads (`leads`)
- **Propósito**: Visualizar os contatos que entraram via webhook e seu status.
- **Dúvidas UI/UX**:
    - [x] O usuário deve poder disparar um funil manualmente para um lead específico diretamente desta lista?
        - **Resposta**: Não é necessário nesta tela, pois o disparo manual já pode ser feito através do Histórico na tela de Integrações.

### 5. Financeiro (`financial`)
- **Propósito**: Controle de custos da API da Meta e faturamento.
- **Dúvidas UI/UX**:
    - [x] Os custos devem ser exibidos apenas em Reais (BRL) ou também na moeda original da Meta (USD)?
        - **Resposta**: 100% em Reais (BRL).

### 6. Histórico de Disparos (`history`)
- **Propósito**: Auditoria de tudo que foi enviado.
- **Dúvidas UI/UX**:
    - [x] Devemos ter um botão de "Re-disparar apenas falhas" de forma global para um lote específico?
        - **Resposta**: Não. O comportamento atual do Histórico já é suficiente.
- **Legenda de Monitoramento (Ícones)**:
    - 🚀 **Total**: Contatos totais da lista.
    - ✅ **Enviados**: Entregues à API da Meta.
    - 📬 **Entregues**: Confirmados no aparelho do contato.
    - 👀 **Lidos**: Visualizados pelo usuário.
    - 👆 **Interações**: Cliques em botões ou respostas.
    - 🚫 **Bloqueios**: Números inválidos ou bloqueados.
    - ⏭️ **Pulados**: Contatos ignorados pelo check de 24h (template já enviado recentemente).
    - ❌ **Falhas**: Erros de processamento ou API.
    - 🔄 **Funis Ativados**: Automações disparadas via botão.
    - 🆓 **Grátis**: Mensagens de sessão (janela 24h).
    - 💰 **Custo**: Valor total em BRL.

---

## 📋 Perguntas de Negócio em Aberto

Abaixo estão as perguntas sobre mecânicas de fundo que ainda não estão documentadas:

- [x] **Regras de Cancelamento Cruzado:** Se um cliente compra o "Produto A", devemos cancelar funis pendentes do "Produto B" ou apenas os funis relacionados ao "Produto A"?
    - **Resposta**: Apenas os funis do mesmo produto. Além disso, o sistema deve respeitar a configuração do dropdown que indica quais eventos específicos devem disparar o cancelamento.
- [x] [NOVO] Como o sistema deve se comportar se o Worker cair durante um disparo em massa? Deve haver um botão de "Retomar" automático?
    - **Resposta**: Sim, deve haver um botão "Retomar" que continue o envio exatamente de onde parou (utilizando a lista de contatos pendentes).
- [x] [NOVO] No histórico, disparos que ficam "travados" por mais de X horas devem ser marcados como falha automaticamente?
    - **Resposta**: Sim. Disparos travados em `processing` ou `queued` por mais de 2 horas serão marcados como falha pelo Scheduler, com a mensagem: "Disparo travado: O tempo limite de processamento (2h) foi excedido".
- [x] [NOVO] O trigger filho gerado para a execução do funil pós-template deve herdar as mesmas etiquetas do Chatwoot (`chatwoot_label`) do disparo pai de template?
    - **Resposta**: Sim, o trigger filho herdará as mesmas etiquetas para garantir a consistência das tags.
- [x] [NOVO] Caso o template falhe em ser enviado pela API da Meta, o funil filho associado não deve ser criado nem executado, marcando apenas o template como falha. Concorda com este comportamento?
    - **Resposta**: Sim, se o envio do template pai falhar, o funil filho correspondente não será criado nem executado.
- [x] [NOVO] No nó de agendamento de data (DateNode), a tolerância de atraso deve ser configurada em minutos, horas ou ambos?
    - **Resposta**: Ambos. O sistema permitirá selecionar a unidade (minutos ou horas) na interface.
- [x] [NOVO] Caso a execução seja considerada "atrasada" e siga para o caminho `late`, mas o usuário não tenha conectado nenhum nó a esta porta, o fluxo deve ser encerrado ou seguir pelo caminho `default` como fallback?
    - **Resposta**: Deve ser encerrado (o fluxo de automação é finalizado se a porta `late` não possuir nenhuma conexão).
- [x] [NOVO] Ao agendar um disparo em massa utilizando Etiquetas, o sistema deve permitir uma opção para buscar dinamicamente os contatos atualizados da etiqueta no momento exato do disparo (capturando novos leads que entraram na etiqueta após a criação do agendamento)?
    - **Resposta**: Sim. Ao marcar essa opção, no momento da execução o worker re-consulta a base e inclui os novos contatos qualificados na etiqueta de destinatário (aumentando o número total de destinatários caso novos contatos entrem). Simultaneamente, se houver filtro de etiquetas na base de exclusão (`exclusion_tags`) ou lista de exclusão manual (`exclusion_list`), o sistema re-verifica no momento do disparo e remove qualquer contato que tenha entrado nas etiquetas de exclusão ou na lista de exclusão, respeitando os modos OR (qualquer etiqueta) ou AND (todas as etiquetas). No Histórico, o número total (🚀 Total) refletirá a contagem final atualizada no momento do envio. Na aba de Agendamentos, será exibido o indicador `🔄 Dinâmico (Etiqueta)` e a quantidade estimada/atualizada.

- [ ] [NOVO] Ao enviar uma mensagem manual ou por template a partir do Chat Local (ZapVoice), o sistema deve aplicar alguma etiqueta automaticamente ao contato? Se sim, qual etiqueta e sob quais condições?
- [x] [NOVO] **E-mail Marketing (Provedor):** O envio de e-mails deve suportar SMTP próprio configurado por cliente ou suporte a APIs nativas (Resend, SendGrid, Amazon SES)?
    - **Resposta**: Suportar **Amazon SES** (Access Key + Secret Key), **Resend** (API Key) e **SMTP Customizado**.
- [x] [NOVO] **E-mail Marketing (Editor):** O editor inicial de templates de e-mail deve ser Rich Text / HTML ou Drag-and-Drop visual?
    - **Resposta**: Editor de Texto Versão 01 (Rich Text + HTML + Variáveis dinâmicas).
- [x] [NOVO] **E-mail Marketing (Rastreamento):** Devemos incluir rastreamento de aberturas (Pixel transparent 1px) e cliques em links nos e-mails disparados?
    - **Resposta**: Não precisa nesta fase inicial. Focar na entrega rápida e histórico simples.
- [x] [NOVO] **Prazo Limite e Expiração de Disparo em Massa:** No disparo em massa, devemos disponibilizar o campo opcional de "Data e Hora Limite de Envio" com fallback automático de 24 horas caso o usuário não preencha? Mensagens retidas na fila da Meta (usuário sem internet) e contatos pendentes serão abortados ao atingir esse prazo.
    - **Resposta**: Sim. Foi disponibilizado o campo opcional "Prazo Limite de Envio" no passo de opções de disparo (`SchedulingSection`). Se o usuário não definir uma data/hora limite personalizada, o sistema adota automaticamente o **fallback padrão de 24 horas** a partir do início do disparo (`started_at`). Ao atingir o prazo limite ou as 24 horas: (1) O envio dos contatos pendentes restantes na lista é imediatamente abortado no backend (`process_bulk_send`), marcando o disparo como `aborted` e os contatos pendentes como falha por timeout; (2) Mensagens retidas na fila da Meta (`status == 'sent'` sem confirmação de `delivered`, ex: contato sem internet/offline) são limpas e marcadas como falha pelo scheduler de limpeza periódica (`cleanup_tasks.py`), atualizando os contadores do histórico.
- [x] [NOVO] **Geração Automática de Convite/Cadastro via Webhook (Área de Membros/Plataforma Externa):** Na aba de Gatilhos das Integrações de Webhook (seção Avançado), deve haver uma opção para gerar convite de acesso do comprador automaticamente via API externa?
    - **Resposta**: Sim. Configuração global da URL base da API e Token (`sk_live_...`) em **Configurações > Plataforma**. No gatilho de cada evento da integração (ex: Compra Aprovada), o usuário ativa o switch de criação automática, define a função/role (`aluno`), prazo do link (`duration_hours`) e lista de cursos (`course_access`). Ao receber o webhook aprovado, o ZapVoice chama `POST /api/v1/invites`, obtém o link e injeta na variável dinâmica `{{link_cadastro}}`, disponibilizando-a para envio imediato no WhatsApp do comprador via template ou funil.


### 11. Gestão de Usuários: Criação Direta e Regras Rígidas de Senha
- **Ações no Header de Gestão de Usuários**:
  - `Criar Usuário` (Botão principal em destaque): Abre modal para cadastro direto de novos usuários ativos no sistema.
  - `Gerar Convite` (Botão secundário translúcido): Mantém o fluxo anterior de geração de links de convite e e-mails com prazo de expiração.
- **Criação Direta sem Código por E-mail**:
  - O cadastro realizado pelo administrador via modal não exige envio de código de confirmação por e-mail; o usuário é criado imediatamente ativo no banco.
  - **Campos Obrigatórios**: Nome do Contato (`full_name`), E-mail de acesso (`email`), WhatsApp / Telefone (`phone`) e Senha de Acesso (`password`).
- **Validação Rígida de Senha Forte (5 Requisitos)**:
  - 1. Mínimo de 12 caracteres (máximo de 128).
  - 2. Pelo menos 1 letra minúscula (`[a-z]`).
  - 3. Pelo menos 1 letra maiúscula (`[A-Z]`).
  - 4. Pelo menos 1 número (`[0-9]`).
  - 5. Pelo menos 1 caractere especial (`[^A-Za-z0-9]`, ex: `!`, `@`, `#`, `$`, `%`, etc.).
  - A interface valida dinamicamente os 5 requisitos em tempo real e desabilita a submissão até que todos estejam cumpridos. O backend reforça a mesma validação no `core/security.py` retornando HTTP 400 descritivo caso qualquer requisito seja violado.
- **Seleção Múltipla e Exclusão em Lote (Bulk Delete)**:
  - Permite selecionar usuários individualmente linha por linha ou selecionar todos os usuários da página/busca através do checkbox mestre no cabeçalho da tabela.
  - **Blindagem do Super Admin**: Usuários com o papel `super_admin` são protegidos contra seleção e exclusão, exibindo o ícone de escudo (`FiShield`) na coluna de seleção sem permitir marcação.
  - Tanto o endpoint individual (`DELETE /auth/users/{user_id}`) quanto o endpoint em lote (`POST /auth/users/bulk-delete`) barram e ignoram qualquer tentativa de exclusão de contas com cargo `super_admin`.
  - A ação de exclusão em massa exige confirmação via popup modal com backdrop escuro (`ConfirmModal`) indicando a quantidade de usuários selecionados.

### 12. Infraestrutura & Monitoramento de Servidor (Super Admin)
- **Acesso Restrito**:
  - A aba `Infraestrutura` na barra lateral e todos os endpoints `/api/infra/*` são restritos exclusivamente a usuários com papel `super_admin` (`require_super_admin`).
- **Recursos do Servidor (RAM & CPU)**:
  - Medição em tempo real de hardware da máquina VPS / Container (`psutil`), apresentando Memória RAM Usada, Total, Livre, Percentual e Consumo de Processo da Aplicação API (RSS).
  - Apresenta carga de processador (CPU %) e quantidade de núcleos virtuais (`vCPUs`).
- **Conexões do Banco de Dados (PostgreSQL)**:
  - Acompanhamento do pool de conexões do SQLAlchemy (`QueuePool`) e conexões ativas no PostgreSQL (`pg_stat_activity`).
  - Capacidade estruturada em Conexões em Uso, Pool Base, Buffer Overflow e Total Máximo de Conexões Simultâneas.
- **Histórico e Picos em Horário de Brasília (UTC-3)**:
  - Todos os registros de maiores picos de RAM, CPU e conexões de banco das últimas 24h, bem como a tabela de histórico por hora, são obrigatoriamente persistidos e exibidos no Horário Oficial de Brasília (UTC-3).
- **Alertas Automáticos via Webhook**:
  - Permite configurar limites de alerta independentes para Conexões (%), RAM (%) e CPU (%).
  - **Cooldown Anti-Spam**: Intervalo mínimo obrigatório (default: 15 minutos) entre notificações consecutivas para evitar inundação de mensagens durante picos prolongados.
  - **Notificação de Normalização**: Envia aviso quando o tráfego e recursos retornarem aos patamares seguros.
  - **Validação de Webhook**: Botão de teste imediato que valida a URL externa com payload estruturado e feedback visual por toast.

### 13. Kanban de Vendas / CRM: Colunas Padrão e Motivo da Desistência
- **5 Colunas Padrão do Pipeline**:
  - 1. **Prospect** (`initial`, ordem 0, cor Azul): Contatos frios ou leads recém-importados/gerados.
  - 2. **Lead** (`in_progress`, ordem 1, cor Ciano): Contatos que demonstraram interesse ou abandonaram checkout/carrinho.
  - 3. **Oportunidade** (`in_progress`, ordem 2, cor Âmbar): Leads com intenção clara de compra, propostas enviadas ou Pix/Boleto gerados.
  - 4. **Venda** (`won`, ordem 3, cor Esmeralda): Negociações concluídas com sucesso e compras aprovadas.
  - 5. **Desistencia** (`lost`, ordem 4, cor Rosa/Vermelho): Oportunidades perdidas ou leads que desistiram da negociação.
- **Campo de Motivo da Desistência (`lost_reason`)**:
  - Sempre que um lead estiver ou for movido para a etapa de **Desistência** (via Drag & Drop ou formulário de oportunidade), o sistema exige/solicita o motivo da perda.
  - **Opções Rápidas & Digitação Livre**: Interface com chips rápidos ("Preço alto / Sem orçamento", "Sem interesse no momento", "Comprou de concorrente", "Não responde / Sumiu", etc.) e campo aberto para anotações detalhadas.
  - **Visualização Rápida no Card**: Quando preenchido, o motivo da desistência é destacado diretamente no corpo do card dentro do Kanban com badge avermelhado sutil.

### 14. Catálogo de Produtos e Precificação no Kanban de Vendas
- **Gerenciador de Produtos (`crm_products`)**:
  - Disponível através do botão "Produtos" no cabeçalho do Kanban.
  - O operador cadastra os produtos da empresa com Nome, Descrição e Preço Padrão/Tabela (R$).
  - Acesso e modificações são 100% isolados pelo cliente ativo (`client_id`).
- **Preenchimento Automático e Preço Real com Desconto (`original_value` vs `value`)**:
  - No formulário do Lead/Oportunidade (`DealModal`), a seleção do Produto preenche automaticamente o Preço de Tabela (`original_value`) e o Valor Real Vendido (`value`).
  - O campo "Valor Real da Venda" é editável livremente pelo operador para registrar vendas com desconto ou condições especiais.
  - Se houver desconto (`value < original_value`), o sistema calcula e exibe em tempo real o desconto aplicado em R$ e percentual.
- **Card do Kanban Redesenhado e Focado**:
  - O card exibe em destaque imediato o **Nome da Pessoa** no topo e o **Preço do Produto** logo abaixo em badge verde.
  - Se vendido com desconto, exibe o valor de tabela riscado e o badge "Desconto".
  - Ao clicar no card inteiro, abre o modal detalhado com todas as informações completas do lead (Nome, WhatsApp, E-mail, Produto, Preço de Tabela, Preço Real, Canal de Origem, Estágio, Status, Motivo da Desistência e Anotações).

### 15. Integração de Webhooks com o CRM / Kanban de Vendas
- **Ativação Opcional por Gatilho**:
  - Na subaba "Avançado" de cada mapeamento de evento do webhook, o usuário pode habilitar o "Kanban de Vendas (CRM)".
  - Permite configurar: Pipeline de Vendas, Coluna/Estágio de Destino, Produto (Catálogo CRM), Valor Estimado em R$ e Motivo da Desistência (quando o estágio for de perda/desistência).
- **Deduplicação Inteligente por Telefone**:
  - Ao disparar o webhook para um contato (`contact_phone`), o sistema busca se o lead já possui uma oportunidade (`SalesDeal`) cadastrada no Pipeline correspondente pelo telefone.
  - **Se já existir**: Atualiza imediatamente a oportunidade para o estágio configurado, ajusta o status da oportunidade (`won` se estágio de vitória, `lost` se estágio de desistência, ou `open` se estágio em andamento), atualiza produto e valor se informados, e grava o motivo da desistência (`lost_reason`) se aplicável.
  - **Se não existir**: Cria um novo Deal com o Nome do Contato, Telefone, E-mail, Origem da Plataforma do Webhook, Produto, Valor e Estágio selecionados.
- **Suporte a Reenvio e Testes**:
  - Tanto no recebimento ao vivo de webhooks quanto no reprocessamento pelo Histórico de Disparos ou Testes de Webhook, a automação do Kanban é acionada respeitando o isolamento multi-tenant (`client_id`).

### 16. Avanço Automático de Contatos entre Pipelines no CRM
- **Configuração no Estágio / Coluna (`StageModal`)**:
  - Em qualquer coluna do Kanban (ex: "Venda" ou qualquer etapa configurada), o operador pode habilitar o switch **"Avançar para outro Pipeline"**.
  - **Seleção Dinâmica**: Apresenta dropdown com os demais pipelines disponíveis do cliente (`forward_to_pipeline_id`) e dropdown com as colunas correspondentes do pipeline selecionado (`forward_to_stage_id`).
- **Gatilho e Execução Automática**:
  - Quando um card/contato atinge essa etapa (seja por arraste manual Drag & Drop, criação direta, atualização via formulário ou gatilho de Webhook), o backend executa imediatamente o encaminhamento (`crm_service.check_and_forward_deal_if_configured`).
  - **Se o lead já possuir oportunidade no pipeline de destino**: A oportunidade existente é atualizada para a coluna configurada, atualizando o status (`won`, `lost` ou `open`) e o timestamp de última interação sem duplicar contatos.
  - **Se for um novo lead no pipeline de destino**: Cria automaticamente a oportunidade com o Telefone, Nome, E-mail e Canal de origem do contato, herdando o Produto e o Valor Padrão (`default_value`) configurados no pipeline de destino.
- **Segurança e Prevenção de Loops**:
  - O sistema impede auto-avanço para o próprio pipeline de origem, bloqueando loops infinitos.
- **Feedback e Identificação Visual**:
  - No cabeçalho da coluna configurada no Kanban, o sistema exibe o indicador visual verde com efeito pulsante: `⚡ Avança automaticamente para outro funil`.

## 📋 Histórico de Decisões
As perguntas iniciais sobre regras de negócio foram todas respondidas e integradas às seções acima. O sistema segue o modelo de isolamento total entre clientes e automação robusta com retentativas configuradas.

---
> 📋 **Documentação Atualizada:** Regras de negócio de Prazo Limite e Expiração de Disparo em Massa consolidadas.

### 17. Sequência de Follow-up em Disparos em Massa (Bulk Sender)
- **Propósito**: Permitir que o operador configure uma cadência de reenvio de templates aprovados pela Meta para recuperação de leads que não interagiram no disparo principal.
- **Configuração no Disparo em Massa**:
  - No Step 2 de execução (ExecutionStep), a seção 'Opções de Disparo' recebe o badge **04**.
  - O operador pode ativar a 'Sequência de Follow-up' e adicionar múltiplas etapas (Follow-up #1, Follow-up #2...).
  - Para cada follow-up configurado:
    - **Template Oficial**: Seleção de template aprovado pela Meta com preenchimento de variáveis e mídias.
    - **Ações dos Botões do Follow-up**: Se o template tiver botões, o operador pode definir a ação de cada botão (Interação com funil/IA ou Bloqueio do contato).
    - **Agendamento Flexível**: Suporte a Data/Hora fixos (calendário) ou Intervalo relativo (ex: 24 horas após o disparo anterior).
- **Critério Rígido de Qualificação de Contatos**:
  - Quando a etapa do follow-up é acionada, o sistema consulta a lista do disparo pai e **SOMENTE qualifica contatos cuja mensagem anterior foi entregue com sucesso** (status delivered ou 
ead).
  - Contatos cujo disparo anterior falhou (ailed), números inválidos ou contatos que entraram na lista de bloqueio (BlockedContact) são sumariamente descartados.
- **Critérios Exclusivos de Interrupção / Cancelamento**:
  - O envio de follow-up para um contato é cancelado **exclusivamente** nas seguintes condições:
    1. **Clique em Botão do Template**: O contato clicou em qualquer botão do template anterior (seja botão de interação com funil ou botão de bloqueio, registrado via MessageStatus.is_interaction == True ou webhook utton_reply).
    2. **Etiqueta de Parada (Stop Tag)**: O contato possui uma das etiquetas de interrupção configuradas no disparo, verificada tanto nas etiquetas da conversa (ChatConversation.labels) quanto nas etiquetas do lead (WebhookLead.tags).
    3. **Cancelamento Manual**: O operador cancelou manualmente a etapa inteira do follow-up (pelo Histórico de Disparos) ou cancelou o follow-up de um lead individual (pelo modal de contatos do histórico ou pelo Chat de atendimento).
  - *Mensagens de texto/áudio simples sem clique em botão e sem etiqueta de parada NÃO cancelam o follow-up automaticamente*.
- **Visibilidade e Rastreamento no Histórico de Disparos**:
  - Cada etapa de follow-up que for agendada/executada é gerada como um disparo independente na tabela scheduled_triggers vinculado pelo parent_id, sendo listada no Histórico de Disparos com badge descritivo claro [Follow-up #N].
