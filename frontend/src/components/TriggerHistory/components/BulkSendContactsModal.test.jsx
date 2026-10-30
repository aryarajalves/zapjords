import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import BulkSendContactsModal from './BulkSendContactsModal';
import { fetchWithAuth } from '../../../AuthContext';

vi.mock('../../../AuthContext', () => ({
    fetchWithAuth: vi.fn()
}));

vi.mock('../../BulkSender/common/SearchableSelect', () => ({
    default: ({ options, value, onChange, placeholder }) => (
        <select
            data-testid="searchable-select"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="">{placeholder}</option>
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    )
}));

vi.mock('../../BulkSender/common/TemplatePreview', () => ({
    default: ({ template, params }) => (
        <div data-testid="template-preview">
            Preview: {template?.name} - {JSON.stringify(params)}
        </div>
    )
}));

vi.mock('../../BulkSender/common/MediaHeaderUploader', () => ({
    default: ({ format, templateParams, handleParamChange }) => (
        <div data-testid="media-uploader">
            Uploader: {format}
            <button onClick={() => handleParamChange('HEADER_0', 'https://mock.url/image.png')}>
                Upload Mock
            </button>
        </div>
    )
}));

describe('BulkSendContactsModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        selectedPhones: ['5511999990035', '5511999990061'],
        clientId: 1,
        onSuccess: vi.fn()
    };

    const mockTemplates = [
        {
            name: 'welcome_message',
            language: 'pt_BR',
            components: [
                { type: 'HEADER', format: 'IMAGE' },
                { type: 'BODY', text: 'Olá {{1}}, bem-vindo!' },
                {
                    type: 'BUTTONS',
                    buttons: [
                        { type: 'QUICK_REPLY', text: 'Clique Aqui' }
                    ]
                }
            ]
        },
        {
            name: 'simple_text',
            language: 'pt_BR',
            components: [
                { type: 'BODY', text: 'Olá, tudo bem?' }
            ]
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        fetchWithAuth.mockImplementation(async (url) => {
            if (url.includes('/funnels')) {
                return { ok: true, json: async () => [{ id: 1, name: 'Funil Teste 1' }] };
            }
            if (url.includes('/templates')) {
                return { ok: true, json: async () => mockTemplates };
            }
            return { ok: true, json: async () => [] };
        });
    });

    it('renders correctly and loads templates', async () => {
        render(<BulkSendContactsModal {...defaultProps} />);

        expect(screen.getByText('Disparo em Massa')).toBeInTheDocument();
        expect(screen.getByText('Disparando para 2 contatos selecionados')).toBeInTheDocument();

        await waitFor(() => {
            expect(fetchWithAuth).toHaveBeenCalled();
        });
    });

    it('displays template variables and allows sending when form is filled', async () => {
        render(<BulkSendContactsModal {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getAllByTestId('searchable-select')[0]).toBeInTheDocument();
        });

        // Selecionar o template 'welcome_message'
        fireEvent.change(screen.getAllByTestId('searchable-select')[0], {
            target: { value: 'welcome_message' }
        });

        // Deve exibir o media uploader para o header e input para o body
        expect(screen.getByTestId('media-uploader')).toBeInTheDocument();
        expect(screen.getByText('Variável do Corpo {{1}}')).toBeInTheDocument();

        // Preencher variáveis
        fireEvent.click(screen.getByText('Upload Mock'));
        fireEvent.change(screen.getByPlaceholderText('Digite o valor para Variável do Corpo {{1}}'), {
            target: { value: 'Fulano' }
        });

        // Enviar disparo
        fetchWithAuth.mockImplementation(async (url) => {
            if (url.includes('/bulk-send/schedule')) return { ok: true };
            if (url.includes('/funnels')) return { ok: true, json: async () => [] };
            if (url.includes('/templates')) return { ok: true, json: async () => mockTemplates };
            return { ok: true };
        });
        
        fireEvent.click(screen.getByText('Enviar Disparo'));

        await waitFor(() => {
            expect(fetchWithAuth).toHaveBeenCalled();
        });
    });

    it('toggles scheduling and updates button text', async () => {
        render(<BulkSendContactsModal {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getAllByTestId('searchable-select')[0]).toBeInTheDocument();
        });

        // Selecionar o template 'welcome_message'
        fireEvent.change(screen.getAllByTestId('searchable-select')[0], {
            target: { value: 'welcome_message' }
        });

        // A princípio o botão deve ser 'Enviar Disparo'
        expect(screen.getByRole('button', { name: 'Enviar Disparo' })).toBeInTheDocument();

        // Clicar no checkbox de agendamento
        const checkbox = screen.getByLabelText('Agendar este disparo?');
        fireEvent.click(checkbox);

        // O botão deve mudar para 'Agendar Disparo'
        expect(screen.getByRole('button', { name: 'Agendar Disparo' })).toBeInTheDocument();
    });

    it('renders button actions section and allows choosing button type', async () => {
        render(<BulkSendContactsModal {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getAllByTestId('searchable-select')[0]).toBeInTheDocument();
        });

        // Selecionar o template 'welcome_message'
        fireEvent.change(screen.getAllByTestId('searchable-select')[0], {
            target: { value: 'welcome_message' }
        });

        // Deve mostrar a seção de ações de botões
        expect(screen.getByText('Ações dos Botões')).toBeInTheDocument();
        expect(screen.getByText('Botão: Clique Aqui')).toBeInTheDocument();

        // Deve ter o SearchableSelect para o Tipo de Ação
        const selects = screen.getAllByTestId('searchable-select');
        expect(selects.length).toBeGreaterThanOrEqual(2);
    });

    it('exibe atalhos de variáveis dinâmicas (+primeiro_nome, +nome, +telefone) e resolve o nome real dos contatos ao enviar', async () => {
        const mockContacts = [
            { phone_number: '5511999990035', contact_name: 'Maria Clara Silva' },
            { phone_number: '5511999990061', contact_name: 'João Pedro Souza' }
        ];

        render(<BulkSendContactsModal {...defaultProps} contacts={mockContacts} />);

        await waitFor(() => {
            expect(screen.getAllByTestId('searchable-select')[0]).toBeInTheDocument();
        });

        fireEvent.change(screen.getAllByTestId('searchable-select')[0], {
            target: { value: 'welcome_message' }
        });

        // Verificar que os botões de atalho dinâmico aparecem
        const btnPrimeiroNome = screen.getByRole('button', { name: '+primeiro_nome' });
        const btnNome = screen.getByRole('button', { name: '+nome' });
        const btnTelefone = screen.getByRole('button', { name: '+telefone' });

        expect(btnPrimeiroNome).toBeInTheDocument();
        expect(btnNome).toBeInTheDocument();
        expect(btnTelefone).toBeInTheDocument();

        // Clicar no atalho +primeiro_nome preenche o input com {{primeiro_nome}}
        fireEvent.click(btnPrimeiroNome);
        const bodyVarInput = screen.getByPlaceholderText('Digite o valor para Variável do Corpo {{1}}');
        expect(bodyVarInput.value).toBe('{{primeiro_nome}}');

        // Preencher mídia obrigatória do header
        fireEvent.click(screen.getByText('Upload Mock'));

        let sentPayload = null;
        fetchWithAuth.mockImplementation(async (url, opts) => {
            if (url.includes('/bulk-send/schedule')) {
                sentPayload = JSON.parse(opts.body);
                return { ok: true, json: async () => ({}) };
            }
            if (url.includes('/funnels')) return { ok: true, json: async () => [] };
            if (url.includes('/templates')) return { ok: true, json: async () => mockTemplates };
            return { ok: true };
        });

        fireEvent.click(screen.getByRole('button', { name: 'Enviar Disparo' }));

        await waitFor(() => {
            expect(sentPayload).not.toBeNull();
        });

        expect(sentPayload.contacts_list).toHaveLength(2);
        expect(sentPayload.contacts_list[0].name).toBe('Maria Clara Silva');
        const bodyComp0 = sentPayload.contacts_list[0].components.find(c => c.type === 'body');
        expect(bodyComp0.parameters[0].text).toBe('Maria');

        expect(sentPayload.contacts_list[1].name).toBe('João Pedro Souza');
        const bodyComp1 = sentPayload.contacts_list[1].components.find(c => c.type === 'body');
        expect(bodyComp1.parameters[0].text).toBe('João');
    });
});
