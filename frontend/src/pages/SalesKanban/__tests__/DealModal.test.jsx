import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DealModal } from '../components/DealModal';

describe('DealModal Component', () => {
    const mockStages = [
        { id: 1, name: 'Primeiro Contato', is_followup: true, followup_delay_value: 24, followup_delay_unit: 'hours' },
        { id: 2, name: 'Apresentar Oferta', is_followup: false },
        { id: 3, name: 'Desistência / Perdido', stage_type: 'lost' }
    ];

    const mockProducts = [
        { id: 10, name: 'Mentoria Premium', price: 2000.00 },
        { id: 20, name: 'Curso Básico', price: 497.00 }
    ];

    it('renderiza os campos básicos em modo de criação', () => {
        render(
            <DealModal
                isOpen={true}
                onClose={vi.fn()}
                onSave={vi.fn()}
                onDelete={vi.fn()}
                stages={mockStages}
                products={mockProducts}
                pipelineId={1}
            />
        );

        expect(screen.getByText('Nova Oportunidade')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Ex: João da Silva')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Ex: 5511999998888')).toBeInTheDocument();
        expect(screen.getByText('Prazo de Follow-up Individual')).toBeInTheDocument();
    });

    it('seleciona produto e recalcula os valores de tabela e venda', () => {
        render(
            <DealModal
                isOpen={true}
                onClose={vi.fn()}
                onSave={vi.fn()}
                onDelete={vi.fn()}
                stages={mockStages}
                products={mockProducts}
                pipelineId={1}
            />
        );

        // Encontra o select de produtos
        const selects = screen.getAllByRole('combobox');
        const prodSelect = selects.find(s => s.innerHTML.includes('Mentoria Premium'));
        expect(prodSelect).toBeTruthy();

        fireEvent.change(prodSelect, { target: { value: '10' } });

        // Verifica inputs de valor
        expect(screen.getAllByDisplayValue('2000').length).toBeGreaterThan(0);
    });

    it('permite ativar prazo de follow-up individual e submeter no payload', async () => {
        const handleSave = vi.fn().mockResolvedValue(true);

        render(
            <DealModal
                isOpen={true}
                onClose={vi.fn()}
                onSave={handleSave}
                onDelete={vi.fn()}
                stages={mockStages}
                products={mockProducts}
                pipelineId={1}
            />
        );

        // Preenche campos obrigatórios
        fireEvent.change(screen.getByPlaceholderText('Ex: João da Silva'), { target: { value: 'Carlos Silva' } });
        fireEvent.change(screen.getByPlaceholderText('Ex: 5511999998888'), { target: { value: '5511988887777' } });

        // Ativa o toggle de follow-up individual
        const checkboxFollowup = screen.getByRole('checkbox');
        fireEvent.click(checkboxFollowup);

        // Define 2 horas como prazo
        const inputPrazo = screen.getByPlaceholderText('Ex: 2');
        fireEvent.change(inputPrazo, { target: { value: '2' } });

        // Submete o formulário
        const submitBtn = screen.getByRole('button', { name: 'Salvar Oportunidade' });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(handleSave).toHaveBeenCalledWith(expect.objectContaining({
                contact_name: 'Carlos Silva',
                contact_phone: '5511988887777',
                custom_followup_delay_value: 2,
                custom_followup_delay_unit: 'hours'
            }));
        });
    });

    it('permite usar botões de atalho rápido para definir o follow-up individual', async () => {
        const handleSave = vi.fn().mockResolvedValue(true);

        render(
            <DealModal
                isOpen={true}
                onClose={vi.fn()}
                onSave={handleSave}
                onDelete={vi.fn()}
                stages={mockStages}
                products={mockProducts}
                pipelineId={1}
            />
        );

        fireEvent.change(screen.getByPlaceholderText('Ex: 5511999998888'), { target: { value: '5511977776666' } });

        // Ativa o toggle
        fireEvent.click(screen.getByRole('checkbox'));

        // Clica no atalho de 3 dias
        const btn3Dias = screen.getByRole('button', { name: '3 dias' });
        fireEvent.click(btn3Dias);

        const submitBtn = screen.getByRole('button', { name: 'Salvar Oportunidade' });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(handleSave).toHaveBeenCalledWith(expect.objectContaining({
                custom_followup_delay_value: 3,
                custom_followup_delay_unit: 'days'
            }));
        });
    });

    it('carrega dados de oportunidade já existente com follow-up individual configurado', () => {
        const existingDeal = {
            id: 99,
            contact_name: 'Mariana Costa',
            contact_phone: '5511955554444',
            value: 1497.00,
            channel: 'whatsapp',
            stage_id: 1,
            status: 'open',
            custom_followup_delay_value: 12,
            custom_followup_delay_unit: 'hours'
        };

        render(
            <DealModal
                isOpen={true}
                dealToEdit={existingDeal}
                onClose={vi.fn()}
                onSave={vi.fn()}
                onDelete={vi.fn()}
                stages={mockStages}
                products={mockProducts}
                pipelineId={1}
            />
        );

        expect(screen.getByDisplayValue('Mariana Costa')).toBeInTheDocument();
        expect(screen.getByDisplayValue('12')).toBeInTheDocument();
        expect(screen.getByText('Excluir')).toBeInTheDocument();
    });
});
