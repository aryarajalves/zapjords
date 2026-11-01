import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import EmailDragDropEditor, { parseHtmlToBlocks } from './EmailDragDropEditor';

vi.mock('../../contexts/ClientContext', () => ({
  useClient: () => ({
    activeClient: { id: 1, name: 'Cliente Teste' }
  })
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('EmailDragDropEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders editor blocks without crashing', () => {
    render(<EmailDragDropEditor initialHtml="" onChangeHtml={() => {}} />);
    expect(screen.getByText(/Clique para Adicionar Bloco:/i)).toBeInTheDocument();
  });

  it('envia o header X-Client-ID ao realizar upload de imagem', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'http://localhost:5000/static/uploads/test.jpg' })
    });

    const { container } = render(<EmailDragDropEditor initialHtml="" onChangeHtml={() => {}} />);

    const imgBlockBtn = screen.getByRole('button', { name: /Imagem/i });
    fireEvent.click(imgBlockBtn);

    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();

    const dummyFile = new File(['dummy content'], 'test.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [dummyFile] } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const fetchArgs = global.fetch.mock.calls[0];
    expect(fetchArgs[0]).toContain('/upload');
    expect(fetchArgs[1].headers).toHaveProperty('X-Client-ID', '1');
  });

  it('restaura blocos customizados a partir do initialHtml fornecido ao abrir um template', () => {
    const customHtml = `
      <!DOCTYPE html>
      <html>
        <body style="background-color: #0f172a;">
          <table role="presentation">
            <tr>
              <td style="padding: 24px;">
                <div style="font-size: 18px; color: #ff0000;">Texto Customizado Salvo do Cliente</div>
                <a href="https://meusite.com" style="background-color: #10b981; color: #ffffff;">Comprar Agora</a>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    render(<EmailDragDropEditor initialHtml={customHtml} onChangeHtml={() => {}} />);

    expect(screen.getAllByText(/Texto Customizado Salvo do Cliente/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Comprar Agora/i).length).toBeGreaterThan(0);
  });

  it('permite adicionar e configurar espessura, cor e margem do bloco Divisor', () => {
    render(<EmailDragDropEditor initialHtml="" onChangeHtml={() => {}} />);

    const dividerBtn = screen.getByRole('button', { name: /Divisor/i });
    fireEvent.click(dividerBtn);

    expect(screen.getByText(/Espessura da Linha \(Tamanho\):/i)).toBeInTheDocument();
    expect(screen.getByText(/Cor da Linha do Divisor:/i)).toBeInTheDocument();
    expect(screen.getByText(/Espaçamento Vertical \(Margem\):/i)).toBeInTheDocument();
  });

  it('evita ciclo de re-renders (flickering) quando onChangeHtml atualiza prop initialHtml no pai', () => {
    const Wrapper = () => {
      const [html, setHtml] = useState('');
      return <EmailDragDropEditor initialHtml={html} onChangeHtml={setHtml} />;
    };

    render(<Wrapper />);

    // Adiciona uma imagem
    const imgBlockBtn = screen.getByRole('button', { name: /Imagem/i });
    fireEvent.click(imgBlockBtn);

    // Seleciona o bloco adicionado sem causar loop infinito
    expect(screen.getByText(/Configuração do Bloco/i)).toBeInTheDocument();
  });

  it('parseHtmlToBlocks converte HTML com HR em bloco de divisor com estilos', () => {
    const html = `
      <table role="presentation">
        <tr>
          <td style="padding: 20px;">
            <hr style="border: 0; border-top: 4px solid #3b82f6; margin: 30px 0;" />
          </td>
        </tr>
      </table>
    `;

    const res = parseHtmlToBlocks(html);
    expect(res).not.toBeNull();
    expect(res.blocks.length).toBe(1);
    expect(res.blocks[0].type).toBe('divider');
    expect(res.blocks[0].thickness).toBe(4);
    expect(res.blocks[0].color).toBe('#3b82f6');
    expect(res.blocks[0].margin).toBe(30);
  });

  it('permite adicionar e configurar o bloco de Lista / Bullets', () => {
    render(<EmailDragDropEditor initialHtml="" onChangeHtml={() => {}} />);

    const listBtn = screen.getByRole('button', { name: /Lista \/ Bullets/i });
    fireEvent.click(listBtn);

    expect(screen.getByText(/Estilo do Marcador:/i)).toBeInTheDocument();
    expect(screen.getByText(/Itens da Lista:/i)).toBeInTheDocument();
    expect(screen.getByText(/Cor do Texto e Marcadores:/i)).toBeInTheDocument();
  });

  it('permite adicionar e configurar o bloco de Redes Sociais', () => {
    render(<EmailDragDropEditor initialHtml="" onChangeHtml={() => {}} />);

    const socialBtn = screen.getByRole('button', { name: /Redes Sociais/i });
    fireEvent.click(socialBtn);

    expect(screen.getByText(/Formato dos Ícones:/i)).toBeInTheDocument();
    expect(screen.getByText(/Alinhamento:/i)).toBeInTheDocument();
    expect(screen.getByText(/Redes Sociais & Links:/i)).toBeInTheDocument();
    expect(screen.getByText(/Instagram/i)).toBeInTheDocument();
  });

  it('permite adicionar e configurar o bloco de Rodapé & Descadastro', () => {
    render(<EmailDragDropEditor initialHtml="" onChangeHtml={() => {}} />);

    const footerBtn = screen.getByRole('button', { name: /Rodapé/i });
    fireEvent.click(footerBtn);

    expect(screen.getByText(/Nome da Empresa \/ Emissor:/i)).toBeInTheDocument();
    expect(screen.getByText(/Endereço Físico \/ CNPJ \(Compliance\):/i)).toBeInTheDocument();
    expect(screen.getByText(/Texto Institucional \/ Motivo do Envio:/i)).toBeInTheDocument();
    expect(screen.getByText(/Link de Descadastro \(Unsubscribe\):/i)).toBeInTheDocument();
  });

  it('parseHtmlToBlocks restaura corretamente blocos list, social e footer de HTML estruturado', () => {
    const html = `
      <table role="presentation">
        <tr>
          <td style="padding: 24px;">
            <div data-block-type="list" data-style-type="arrow" style="font-size: 16px; color: #1e293b;">
              <ul style="margin: 0;">
                <li><span style="color: #3b82f6;">→</span>Primeiro público</li>
                <li><span style="color: #3b82f6;">→</span>Segundo público</li>
              </ul>
            </div>
            <div data-block-type="social" style="text-align: center;">
              <a href="https://instagram.com/pedrosobral" target="_blank">ig</a>
              <a href="https://youtube.com/pedrosobral" target="_blank">yt</a>
            </div>
            <div data-block-type="footer" style="text-align: center; font-size: 11px; color: #64748b;">
              <div style="font-weight: bold;">Sobral Mídias Digitais LTDA</div>
              <div>Av. das Américas, 500</div>
              <div>Você está recebendo este e-mail porque assinou nossa newsletter.</div>
              <div>Enviado para: <u>cliente@email.com</u> &nbsp;|&nbsp; <a href="https://desinscrever.com">Cancelar a inscrição</a></div>
            </div>
          </td>
        </tr>
      </table>
    `;

    const res = parseHtmlToBlocks(html);
    expect(res).not.toBeNull();
    expect(res.blocks.length).toBe(3);

    // Bloco 1: Lista
    expect(res.blocks[0].type).toBe('list');
    expect(res.blocks[0].styleType).toBe('arrow');
    expect(res.blocks[0].items).toEqual(['Primeiro público', 'Segundo público']);

    // Bloco 2: Social
    expect(res.blocks[1].type).toBe('social');
    expect(res.blocks[1].instagram).toBe('https://instagram.com/pedrosobral');
    expect(res.blocks[1].youtube).toBe('https://youtube.com/pedrosobral');

    // Bloco 3: Footer
    expect(res.blocks[2].type).toBe('footer');
    expect(res.blocks[2].companyName).toBe('Sobral Mídias Digitais LTDA');
    expect(res.blocks[2].address).toBe('Av. das Américas, 500');
    expect(res.blocks[2].recipientEmail).toBe('cliente@email.com');
    expect(res.blocks[2].unsubscribeUrl).toBe('https://desinscrever.com');
  });

  it('permite maximizar o campo de texto e inserir variáveis como {{primeiro_nome}}, {{email}} e {{telefone}}', () => {
    render(<EmailDragDropEditor initialHtml="" onChangeHtml={() => {}} />);

    // Bloco inicial b-1 é do tipo 'text', portanto o botão 'Maximizar' deve estar visível
    const maximizeBtn = screen.getByRole('button', { name: /Maximizar/i });
    expect(maximizeBtn).toBeInTheDocument();

    // Abre o modal de tela cheia
    fireEvent.click(maximizeBtn);

    expect(screen.getByText(/Editar Texto do E-mail \(Modo Expandido\)/i)).toBeInTheDocument();

    // Insere variável primeiro_nome a partir dos botões do modal maximizado
    const primeiroNomeBtns = screen.getAllByRole('button', { name: /\{\{primeiro_nome\}\}/i });
    expect(primeiroNomeBtns.length).toBeGreaterThan(0);
    fireEvent.click(primeiroNomeBtns[primeiroNomeBtns.length - 1]);

    // Conclui e fecha o modal
    const closeBtn = screen.getByRole('button', { name: /Concluir e Voltar/i });
    fireEvent.click(closeBtn);

    // O modal deve fechar
    expect(screen.queryByText(/Editar Texto do E-mail \(Modo Expandido\)/i)).not.toBeInTheDocument();

    // O textarea normal deve conter a variável inserida
    const textareas = screen.getAllByRole('textbox');
    const hasVar = textareas.some(t => t.value.includes('{{primeiro_nome}}'));
    expect(hasVar).toBe(true);
  });
});
