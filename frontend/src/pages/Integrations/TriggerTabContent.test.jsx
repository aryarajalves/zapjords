import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import TriggerTabContent from './components/MappingsConfig/MappingItem/TriggerTabContent';

vi.mock('../../components/BulkSender/common/TemplatePreview', () => ({
  default: () => <div data-testid="whatsapp-template-preview">Mock WhatsApp Template Preview</div>
}));

vi.mock('./components/BussolaPdfPreviewModal', () => ({
  default: () => null
}));

describe('TriggerTabContent - Prévia do Template restrita ao WhatsApp', () => {
  const baseMapping = {
    id: 1,
    event_type: 'compra_aprovada',
    template_name: '',
    email_active: true,
    email_template_id: 10,
    email_subject: 'Bem-vindo ao curso'
  };

  const emailTemplates = [
    {
      id: 10,
      name: 'Boas vindas',
      subject: 'Bem-vindo ao curso',
      body_html: '<p>Olá!</p>'
    }
  ];

  it('não deve exibir prévia para e-mail marketing, mesmo com template de e-mail selecionado', () => {
    render(
      <TriggerTabContent
        mapping={baseMapping}
        mIndex={0}
        updateMapping={vi.fn()}
        templates={[]}
        funnels={[]}
        discoveredProducts={[]}
        platform="kiwify"
        allowedEvents={['compra_aprovada']}
        selectedTpl={null}
        templateButtons={[]}
        integrationId="kiwify_1"
        onGoToButtonsTab={vi.fn()}
        emailTemplates={emailTemplates}
      />
    );

    // Garante que NUNCA exibe 'Prévia do E-mail Marketing'
    expect(screen.queryByText('Prévia do E-mail Marketing')).not.toBeInTheDocument();
    expect(screen.queryByText(/Assunto:/i)).not.toBeInTheDocument();

    // Como não há template de WhatsApp selecionado, mostra o fallback padrão
    expect(screen.getByText('Nenhum template selecionado')).toBeInTheDocument();
    expect(screen.getByText('Selecione um template para ver a prévia')).toBeInTheDocument();
  });

  it('deve exibir a prévia apenas quando um template oficial do WhatsApp estiver selecionado', () => {
    const whatsappTemplate = {
      id: 99,
      name: 'template_oficial_waba',
      components: [{ type: 'BODY', text: 'Olá {{1}}' }]
    };

    render(
      <TriggerTabContent
        mapping={{ ...baseMapping, template_name: 'template_oficial_waba' }}
        mIndex={0}
        updateMapping={vi.fn()}
        templates={[whatsappTemplate]}
        funnels={[]}
        discoveredProducts={[]}
        platform="kiwify"
        allowedEvents={['compra_aprovada']}
        selectedTpl={whatsappTemplate}
        templateButtons={[]}
        integrationId="kiwify_1"
        onGoToButtonsTab={vi.fn()}
        emailTemplates={emailTemplates}
      />
    );

    // Deve exibir a prévia do WhatsApp
    expect(screen.getByTestId('whatsapp-template-preview')).toBeInTheDocument();
    expect(screen.getByText('template_oficial_waba')).toBeInTheDocument();
    // E não deve exibir prévia de e-mail
    expect(screen.queryByText('Prévia do E-mail Marketing')).not.toBeInTheDocument();
  });
});
