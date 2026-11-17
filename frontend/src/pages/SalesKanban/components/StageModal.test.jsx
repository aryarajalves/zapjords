import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StageModal } from './StageModal';
import * as AuthContext from '../../../AuthContext';

vi.mock('../../../contexts/ClientContext', () => ({
  useClient: () => ({ activeClient: { id: 14, name: 'Cliente - Crassus' } })
}));

vi.mock('./StageForwardSection', () => ({
  StageForwardSection: () => <div data-testid="mock-stage-forward" />
}));

vi.mock('./StageFollowupSection', () => ({
  StageFollowupSection: () => <div data-testid="mock-stage-followup" />
}));

describe('StageModal Contact Tag Trigger Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carrega etiquetas da aba Contatos no dropdown e envia contact_tag_trigger ao salvar', async () => {
    vi.spyOn(AuthContext, 'fetchWithAuth').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tags: ['Compra Aprovada', 'comprou_astrowake'] })
    });

    const onSave = vi.fn().mockResolvedValue(undefined);
    const stageToEdit = {
      id: 10,
      pipeline_id: 2,
      name: 'Venda',
      color: 'emerald',
      stage_type: 'won',
      webhook_event_trigger: 'compra_aprovada',
      contact_tag_trigger: ''
    };

    render(
      <StageModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
        onDelete={vi.fn()}
        stageToEdit={stageToEdit}
        pipelineId={2}
        pipelines={[]}
      />
    );

    const select = await screen.findByLabelText(/Etiqueta da Aba de Contatos \(Opcional\)/i);
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'comprou_astrowake' })).toBeInTheDocument();
    });

    fireEvent.change(select, { target: { value: 'comprou_astrowake' } });
    fireEvent.click(screen.getByRole('button', { name: /Salvar Coluna/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Venda',
          stage_type: 'won',
          contact_tag_trigger: 'comprou_astrowake'
        }),
        10
      );
    });
  });
});
