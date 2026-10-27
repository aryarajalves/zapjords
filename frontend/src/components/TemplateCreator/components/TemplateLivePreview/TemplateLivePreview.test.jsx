import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TemplateLivePreview from './index';
import { extractVariableIndexes, formatWhatsAppMarkdown, renderWhatsAppTextWithVariables } from './formatters';

describe('TemplateLivePreview Unit Tests Suite', () => {
    describe('formatters utility', () => {
        it('extrai corretamente índices de variáveis ordenados sem duplicatas', () => {
            const text = 'Olá {{2}}, seja bem vindo {{1}}! Seu código é {{2}} e pedido {{10}}.';
            const ids = extractVariableIndexes(text);
            expect(ids).toEqual(['1', '2', '10']);
        });

        it('retorna array vazio para textos sem variáveis ou nulos', () => {
            expect(extractVariableIndexes('')).toEqual([]);
            expect(extractVariableIndexes(null)).toEqual([]);
            expect(extractVariableIndexes('Texto comum sem variáveis')).toEqual([]);
        });

        it('formata markdown do WhatsApp: negrito, itálico, tachado e código', () => {
            const raw = '*negrito* e _itálico_ e ~tachado~ e ```código```';
            const { container } = render(<div>{formatWhatsAppMarkdown(raw)}</div>);

            expect(container.querySelector('strong')).toHaveTextContent('negrito');
            expect(container.querySelector('em')).toHaveTextContent('itálico');
            expect(container.querySelector('del')).toHaveTextContent('tachado');
            expect(container.querySelector('code')).toHaveTextContent('código');
        });

        it('renderiza variáveis substituídas quando houver valores de teste', () => {
            const raw = 'Olá {{1}}, bem-vindo ao curso {{2}}!';
            const testValues = { '1': 'Arthur', '2': 'ZapJords' };
            const { container } = render(<div>{renderWhatsAppTextWithVariables(raw, testValues)}</div>);

            expect(container).toHaveTextContent('Olá Arthur, bem-vindo ao curso ZapJords!');
        });

        it('renderiza tag destacada pulsante quando variável não tiver valor de teste', () => {
            const raw = 'Olá {{1}}!';
            const { container } = render(<div>{renderWhatsAppTextWithVariables(raw, {})}</div>);

            expect(container).toHaveTextContent('{{1}}');
        });
    });

    describe('TemplateLivePreview Component', () => {
        const createMockLogic = (overrides = {}) => ({
            formData: {
                name: 'template_boas_vindas',
                category: 'MARKETING',
                language: 'pt_BR',
                header_type: 'TEXT',
                header_text: 'Aviso Importante {{1}}',
                header_media_url: '',
                body_text: 'Olá *{{1}}*, sua compra no valor de ~R$ 100~ por *R$ 50* foi confirmada!\nClique no botão abaixo:',
                footer_text: 'Equipe de Suporte Oficial',
                buttons: [
                    { type: 'URL', text: 'Acessar Área de Membros', url: 'https://exemplo.com' },
                    { type: 'PHONE_NUMBER', text: 'Ligar para Suporte', phone_number: '+558599999999' },
                    { type: 'QUICK_REPLY', text: 'Confirmar' }
                ],
                ...overrides.formData
            },
            mediaCache: {
                IMAGE: { url: '', fileName: '', previewUrl: null },
                VIDEO: { url: '', fileName: '', previewUrl: null },
                DOCUMENT: { url: '', fileName: '', previewUrl: null },
                ...overrides.mediaCache
            },
            activeClient: {
                name: 'Minha Empresa VIP',
                ...overrides.activeClient
            }
        });

        it('renderiza o cabeçalho, corpo, rodapé e botões na prévia do WhatsApp', () => {
            const logic = createMockLogic();
            render(<TemplateLivePreview logic={logic} />);

            // Header da prévia
            expect(screen.getByText('Prévia do WhatsApp')).toBeInTheDocument();
            expect(screen.getByText('Ao Vivo')).toBeInTheDocument();

            // Nome da empresa no topo do mockup
            expect(screen.getByText('Minha Empresa VIP')).toBeInTheDocument();

            // Botões do WhatsApp
            expect(screen.getByText('Acessar Área de Membros')).toBeInTheDocument();
            expect(screen.getByText('Ligar para Suporte')).toBeInTheDocument();
            expect(screen.getByText('Confirmar')).toBeInTheDocument();

            // Rodapé
            expect(screen.getByText('Equipe de Suporte Oficial')).toBeInTheDocument();
        });

        it('permite alternar entre tema Escuro e Claro do WhatsApp', () => {
            const logic = createMockLogic();
            render(<TemplateLivePreview logic={logic} />);

            const darkBtn = screen.getByRole('button', { name: /Escuro/i });
            const lightBtn = screen.getByRole('button', { name: /Claro/i });

            expect(darkBtn).toBeInTheDocument();
            expect(lightBtn).toBeInTheDocument();

            // Clica em Claro
            fireEvent.click(lightBtn);
            // Verifica se o botão Claro ficou selecionado
            expect(lightBtn.className).toContain('bg-white');

            // Clica em Escuro
            fireEvent.click(darkBtn);
            expect(darkBtn.className).toContain('bg-slate-800');
        });

        it('permite preencher valores de teste para as variáveis e atualiza a prévia', () => {
            const logic = createMockLogic();
            render(<TemplateLivePreview logic={logic} />);

            // Campo de input da variável {{1}}
            const varInput = screen.getByPlaceholderText('Valor de teste 1');
            expect(varInput).toBeInTheDocument();

            fireEvent.change(varInput, { target: { value: 'João Silva' } });

            // A prévia deve exibir 'João Silva'
            expect(screen.getAllByText('João Silva').length).toBeGreaterThan(0);
        });

        it('botão Auto preenche automaticamente as variáveis com dados de teste', () => {
            const logic = createMockLogic();
            render(<TemplateLivePreview logic={logic} />);

            const autoBtn = screen.getByRole('button', { name: /Auto/i });
            fireEvent.click(autoBtn);

            const varInput = screen.getByPlaceholderText('Valor de teste 1');
            expect(varInput.value).toBe('Arthur');
            expect(screen.getAllByText('Arthur').length).toBeGreaterThan(0);
        });

        it('botão Limpar esvazia as variáveis de teste', () => {
            const logic = createMockLogic();
            render(<TemplateLivePreview logic={logic} />);

            const autoBtn = screen.getByRole('button', { name: /Auto/i });
            fireEvent.click(autoBtn);

            const clearBtn = screen.getByRole('button', { name: /Limpar/i });
            fireEvent.click(clearBtn);

            const varInput = screen.getByPlaceholderText('Valor de teste 1');
            expect(varInput.value).toBe('');
        });

        it('renderiza cabeçalho com imagem quando header_type for IMAGE', () => {
            const logic = createMockLogic({
                formData: {
                    header_type: 'IMAGE',
                    header_media_url: 'https://exemplo.com/banner.jpg',
                    body_text: 'Template com imagem'
                }
            });

            render(<TemplateLivePreview logic={logic} />);
            const img = screen.getByAltText('Header Preview');
            expect(img).toBeInTheDocument();
            expect(img.getAttribute('src')).toBe('https://exemplo.com/banner.jpg');
        });

        it('renderiza cabeçalho com documento PDF quando header_type for DOCUMENT', () => {
            const logic = createMockLogic({
                formData: {
                    header_type: 'DOCUMENT',
                    body_text: 'Template com documento'
                },
                mediaCache: {
                    DOCUMENT: { fileName: 'contrato_adesao.pdf' }
                }
            });

            render(<TemplateLivePreview logic={logic} />);
            expect(screen.getByText('contrato_adesao.pdf')).toBeInTheDocument();
            expect(screen.getByText('Documento PDF')).toBeInTheDocument();
        });

        it('exibe alerta de política da Meta quando há variáveis consecutivas', () => {
            const logic = createMockLogic({
                formData: {
                    body_text: 'Olá {{1}}{{2}}, seu plano foi ativado.'
                }
            });

            render(<TemplateLivePreview logic={logic} />);
            expect(screen.getByText(/A Meta reprova variáveis consecutivas/i)).toBeInTheDocument();
        });

        it('exibe alerta de política da Meta quando excede 1024 caracteres', () => {
            const longText = 'a'.repeat(1025);
            const logic = createMockLogic({
                formData: {
                    body_text: longText
                }
            });

            render(<TemplateLivePreview logic={logic} />);
            expect(screen.getByText(/O corpo excedeu o limite máximo da Meta/i)).toBeInTheDocument();
        });
    });
});
