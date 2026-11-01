import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EmailMarketingTriggerSection from './EmailMarketingTriggerSection';

describe('EmailMarketingTriggerSection', () => {
  it('renderiza o bloco de email marketing desativado por padrão com botão toggle', () => {
    const updateMapping = vi.fn();
    const mapping = {
      email_active: false,
      email_template_id: null,
      email_funnel_id: null,
      email_subject: ''
    };

    render(
      <EmailMarketingTriggerSection
        mapping={mapping}
        mIndex={0}
        updateMapping={updateMapping}
        emailTemplates={[]}
        emailFunnels={[]}
      />
    );

    expect(screen.getByText(/3\. Disparo por E-mail Marketing \(Opcional\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Ative para disparar um e-mail individual ou matricular o cliente em um Funil/i)).toBeInTheDocument();
  });

  it('exibe seletores de template e funil quando email_active está ativo', () => {
    const updateMapping = vi.fn();
    const mapping = {
      email_active: true,
      email_template_id: 10,
      email_funnel_id: null,
      email_subject: 'Treinamento VIP'
    };

    const emailTemplates = [
      { id: 10, name: 'Template Boas Vindas', subject: 'Seu acesso chegou' }
    ];

    const emailFunnels = [
      { id: 20, name: 'Funil Onboarding', is_active: true, trigger_tag: 'onboarding' }
    ];

    render(
      <EmailMarketingTriggerSection
        mapping={mapping}
        mIndex={0}
        updateMapping={updateMapping}
        emailTemplates={emailTemplates}
        emailFunnels={emailFunnels}
      />
    );

    expect(screen.getByText(/Template de E-mail/i)).toBeInTheDocument();
    expect(screen.getByText(/Funil de E-mail Marketing/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ex: Seu acesso ao treinamento chegou!/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Treinamento VIP')).toBeInTheDocument();
  });
});
