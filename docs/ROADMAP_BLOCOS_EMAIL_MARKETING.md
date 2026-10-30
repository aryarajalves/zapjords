# 📧 Roadmap de Novos Blocos do Criador de E-mail Marketing

Este documento consolida o planejamento e as especificações técnicas dos blocos visuais recomendados para enriquecer o Criador de E-mails do ZapVoice em futuras iterações.

---

## 🎯 Visão Geral e Prioridades

| Bloco | Prioridade | Impacto | Principal Utilidade no ZapVoice |
| :--- | :---: | :---: | :--- |
| **💡 Caixa de Destaque (Callout)** | Alta | ⭐⭐⭐⭐⭐ | Destacar dados de compra, chave Pix, links de aula e avisos críticos |
| **⏳ Cronômetro Regressivo** | Alta | ⭐⭐⭐⭐⭐ | Urgência real em recuperação de carrinho abandonado e Pix gerado |
| **⭐ Depoimento / Prova Social** | Média | ⭐⭐⭐⭐ | Quebra de objeção e validação social em e-mails de vendas |
| **📲 Redes Sociais no Rodapé** | Média | ⭐⭐⭐⭐ | Engajamento multicanal (Instagram, YouTube, WhatsApp, TikTok) |
| **📐 Espaçador (Spacer)** | Média | ⭐⭐⭐⭐ | Respiro visual, alinhamento e acabamento estético "Premium" |
| **🏷️ Cupom de Desconto** | Complementar | ⭐⭐⭐⭐ | Ofertas relâmpago com código em destaque |
| **📦 Resumo do Pedido / Produto** | Complementar | ⭐⭐⭐⭐⭐ | E-mails transacionais de compra e recuperação automática |

---

## 🧱 Especificações Detalhadas dos Blocos

### 1. 💡 Caixa de Destaque (Callout / Notice Box)
- **Objetivo**: Chamar atenção imediata para informações cruciais que o lead não pode ignorar (ex: Chave Pix para pagamento, link de acesso à área de membros, avisos de confirmação).
- **Opções de Customização**:
  - **Tipo / Tom**: Informativo (Azul), Sucesso (Verde esmeralda), Alerta / Urgência (Âmbar/Laranja), Destaque Especial (Roxo neon).
  - **Ícone**: Seleção de ícones (Lâmpada 💡, Check ✅, Alerta ⚠️, Chave 🔑, Fogo 🔥).
  - **Cores**: Cor de fundo suave (background tint) e borda lateral esquerda mais espessa (estilo GitHub callout).
  - **Conteúdo**: Título em negrito e corpo de texto com suporte às variáveis dinâmicas (`{{nome}}`, `{{valor}}`, `{{pix_qrcode}}`).
- **Renderização HTML**:
  - Tabela HTML com borda sólida esquerda de 4px, cantos levemente arredondados e preenchimento interno (`padding: 16px;`) 100% compatível com Gmail, Outlook e Apple Mail.

---

### 2. ⏳ Cronômetro Regressivo (Countdown Timer Dinâmico)
- **Objetivo**: Aumentar drasticamente a taxa de conversão em e-mails de recuperação de carrinho, checkout expirando e campanhas de lançamento.
- **Tipos de Contagem**:
  - **Data e Hora Fixas**: Contagem regressiva até uma data/horário específico (ex: "A oferta encerra sexta-feira às 23:59").
  - **Tempo Relativo (Evergreen)**: Contagem regressiva dinâmica calculada a partir do momento do disparo (ex: "Sua vaga está reservada por apenas 2 horas").
- **Opções de Customização**:
  - Cores dos blocos dos números e dos textos (Dias, Horas, Minutos, Segundos).
  - Mensagem automática de expiração quando o tempo zerar (ex: *"Esta oferta encerrou"*).
- **Implementação Técnica**:
  - Como clientes de e-mail bloqueiam JavaScript, o timer é renderizado como um **GIF animado em tempo real** gerado por um endpoint leve do backend:
    `GET /api/email/timer.gif?expires=TIMESTAMP&bg=1e293b&color=ffffff`.

---

### 3. ⭐ Depoimento / Prova Social (Testimonial Card)
- **Objetivo**: Eliminar dúvidas de compra apresentando casos reais de clientes satisfeitos diretamente no corpo do e-mail.
- **Opções de Customização**:
  - **Avatar / Foto**: URL da foto do cliente ou ícone circular com iniciais.
  - **Nome e Cargo/Profissão**: Ex: *"Mariana Souza • Aluna da Formação"*.
  - **Estrelas de Avaliação**: Seletor de 1 a 5 estrelas douradas (`⭐⭐⭐⭐⭐`).
  - **Texto do Depoimento**: Citação em itálico entre aspas.
  - **Estilo**: Card com fundo escuro, borda translúcida e sombra suave.
- **Renderização HTML**:
  - Estrutura em tabela com 2 colunas para foto/avatar e dados textuais ao lado.

---

### 4. 📲 Redes Sociais no Rodapé (Social Links Bar)
- **Objetivo**: Conectar o lead ao ecossistema da marca, aumentando seguidores e pontos de contato.
- **Canais Suportados**:
  - Instagram, YouTube, WhatsApp, TikTok, Telegram, Facebook, LinkedIn, Twitter/X e Site Oficial.
- **Opções de Customização**:
  - **Estilo dos Ícones**: Ícones circulares coloridos oficiais, versão monocromática (cinza/branco para visual minimalista) ou versão neon.
  - **Alinhamento**: Centralizado (padrão), à esquerda ou à direita.
  - **Links Rápidos**: Campo para colar a URL direta de cada rede social ativa.

---

### 5. 📐 Espaçador (Spacer)
- **Objetivo**: Garantir que o design do e-mail respire adequadamente em qualquer tela (mobile e desktop), evitando blocos colados uns nos outros.
- **Opções de Customização**:
  - **Altura em Pixels**: Slider ou input numérico de `10px` a `80px` (padrão `24px`).
  - **Linha Opcional**: Opção de transformar o espaçador em uma divisória com linha discreta ou mantê-lo invisível.

---

### 6. 🏷️ Bloco de Cupom de Desconto (Voucher Card)
- **Objetivo**: Dar destaque a cupons de incentivo para compra imediata.
- **Opções de Customização**:
  - **Código do Cupom**: Texto em caixa alta e fonte monoespaçada (ex: `PRIMEIRACOMPRA10`).
  - **Porcentagem / Valor**: Ex: *"10% OFF"*, *"R$ 50 de Desconto"*.
  - **Data de Validade**: Ex: *"Válido até hoje às 23:59"*.
  - **Borda**: Borda tracejada (dashed border) estilizada no padrão de cupom destacável.

---

### 7. 📦 Resumo do Pedido / Produto (Cart / Order Summary)
- **Objetivo**: Ideal para disparos automáticos de funil para leads que abandonaram o carrinho ou geraram Pix.
- **Opções de Customização**:
  - Imagem do produto, nome do produto (`{{produto}}`), valor original riscado e valor final (`{{valor}}`).
  - Botão de Ação Direta: *"Finalizar Minha Compra"* ou *"Copiar Código Pix"*.
  - Integração automática com as variáveis recebidas via webhook das plataformas de checkout.

---

## 🛠️ Arquitetura de Implementação no Frontend

Ao implementar esses blocos no `frontend/src/components/EmailMarketing/`:
1. Criar a pasta de sub-blocos modulares `components/templates/blocks/`:
   - `CalloutBlock.jsx`
   - `CountdownBlock.jsx`
   - `TestimonialBlock.jsx`
   - `SocialLinksBlock.jsx`
   - `SpacerBlock.jsx`
   - `CouponBlock.jsx`
2. Adicionar os botões correspondentes na barra lateral *"Clique para adicionar bloco"* do editor de templates.
3. Manter o gerador de HTML (`templateHtmlGenerator.js`) atualizado para exportar tabelas compatíveis com todos os webmails.
