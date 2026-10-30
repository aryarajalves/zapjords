import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BulkTemplateVariables from './BulkTemplateVariables';

// Mock do MediaHeaderUploader para testar de forma isolada e previsível
vi.mock('../../../../components/BulkSender/common/MediaHeaderUploader', () => ({
    default: ({ format, templateParams, handleParamChange }) => (
        <div data-testid="mock-media-header-uploader">
            <span>Uploader para formato: {format}</span>
            <button
                type="button"
                onClick={() => handleParamChange('HEADER_0', 'https://minio.com/foto_anterior.jpg')}
            >
                Simular Seleção de Mídia Salva
            </button>
            <div data-testid="current-media-url">{templateParams['HEADER_0']}</div>
        </div>
    )
}));

describe('BulkTemplateVariables Component Tests', () => {
    it('renderiza o MediaHeaderUploader se o template possuir cabeçalho de mídia (ex: VIDEO ou IMAGE)', () => {
        const templateWithMedia = {
            name: 'video_promocional',
            language: 'pt_BR',
            components: [
                { type: 'HEADER', format: 'VIDEO' },
                { type: 'BODY', text: 'Veja o vídeo especial!' }
            ]
        };

        const Wrapper = () => {
            const [params, setParams] = useState({});
            return (
                <BulkTemplateVariables
                    selectedTemplate={templateWithMedia}
                    templateParams={params}
                    setTemplateParams={setParams}
                />
            );
        };

        render(<Wrapper />);

        expect(screen.getByTestId('mock-media-header-uploader')).toBeInTheDocument();
        expect(screen.getByText('Uploader para formato: VIDEO')).toBeInTheDocument();

        // Simula a seleção de uma mídia anterior
        const selectSavedBtn = screen.getByText('Simular Seleção de Mídia Salva');
        fireEvent.click(selectSavedBtn);

        expect(screen.getByTestId('current-media-url')).toHaveTextContent('https://minio.com/foto_anterior.jpg');
    });

    it('identifica se possui variáveis e permite definir o valor da variável com atalhos rápidos e pré-visualização em tempo real', () => {
        const templateWithVars = {
            name: 'aviso_com_variaveis',
            language: 'pt_BR',
            components: [
                { type: 'BODY', text: 'Olá {{1}}, seu código de acesso é {{2}}!' }
            ]
        };

        const Wrapper = () => {
            const [params, setParams] = useState({});
            return (
                <BulkTemplateVariables
                    selectedTemplate={templateWithVars}
                    templateParams={params}
                    setTemplateParams={setParams}
                />
            );
        };

        render(<Wrapper />);

        // Identifica que possui variáveis
        expect(screen.getByText(/variáveis do template/i)).toBeInTheDocument();
        expect(screen.getByText('2 variáveis encontradas')).toBeInTheDocument();
        expect(screen.getByText('Corpo {{1}}')).toBeInTheDocument();
        expect(screen.getByText('Corpo {{2}}')).toBeInTheDocument();

        // Antes de preencher, pré-visualização mostra variáveis pendentes
        expect(screen.getByTitle('Variável {{1}} pendente')).toHaveTextContent('{{1}}');

        // Clica no atalho rápido "+primeiro_nome" para {{1}}
        const quickTagBtns = screen.getAllByRole('button', { name: /\+primeiro_nome/i });
        fireEvent.click(quickTagBtns[0]);

        // Pré-visualização agora exibe a variável preenchida com primeiro_nome
        expect(screen.getByTitle('Valor definido para {{1}}')).toHaveTextContent('{{primeiro_nome}}');

        // Se clicar em "+nome", deve APAGAR o valor anterior e deixar APENAS "{{nome}}" (sem concatenar)
        const nameTagBtns = screen.getAllByRole('button', { name: /\+nome/i });
        fireEvent.click(nameTagBtns[0]);
        expect(screen.getByTitle('Valor definido para {{1}}')).toHaveTextContent('{{nome}}');

        // Se clicar em "+telefone", deve APAGAR e deixar APENAS "{{telefone}}"
        const phoneTagBtns = screen.getAllByRole('button', { name: /\+telefone/i });
        fireEvent.click(phoneTagBtns[0]);
        expect(screen.getByTitle('Valor definido para {{1}}')).toHaveTextContent('{{telefone}}');

        // Digita um valor manual para a variável {{2}}
        const var2Input = screen.getByPlaceholderText(/valor para corpo \{\{2\}\}/i);
        fireEvent.change(var2Input, { target: { value: 'XYZ-999' } });

        expect(screen.getByTitle('Valor definido para {{2}}')).toHaveTextContent('XYZ-999');
    });

    it('exibe confirmação explícita de "Este template não requer variáveis" quando não houver variáveis', () => {
        const templateNoVars = {
            name: 'template_sem_variaveis',
            language: 'pt_BR',
            components: [
                { type: 'BODY', text: 'Mensagem informativa padrão sem nenhuma variável.' }
            ]
        };

        render(
            <BulkTemplateVariables
                selectedTemplate={templateNoVars}
                templateParams={{}}
                setTemplateParams={vi.fn()}
            />
        );

        expect(screen.getByText(/este template não requer variáveis de texto adicionais/i)).toBeInTheDocument();
        expect(screen.getByText(/sem variáveis/i)).toBeInTheDocument();
        expect(screen.getByText('Mensagem informativa padrão sem nenhuma variável.')).toBeInTheDocument();
    });
});
