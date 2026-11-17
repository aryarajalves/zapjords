import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmailTemplateEditModal from './EmailTemplateEditModal';
import EmailHtmlImportPanel from './EmailHtmlImportPanel';

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock('react-hot-toast', () => ({
  toast: {
    success: (...args) => mockToastSuccess(...args),
    error: (...args) => mockToastError(...args)
  }
}));

vi.mock('../EmailDragDropEditor', () => ({
  __esModule: true,
  default: ({ initialHtml }) => (
    <div data-testid="mock-drag-drop-editor">DragDrop: {initialHtml}</div>
  ),
  CONTACT_VARIABLES: [
    { code: '{{primeiro_nome}}', label: 'Primeiro Nome' },
    { code: '{{nome}}', label: 'Nome Completo' },
    { code: '{{email}}', label: 'E-mail' },
    { code: '{{link_cadastro}}', label: 'Link Área de Membros' },
    { code: '{{link_bussola}}', label: 'Link Bússola' }
  ]
}));

vi.mock('../../../pages/Integrations/components/MappingsConfig/PlatformInviteSection', () => ({
  __esModule: true,
  default: ({ mapping, updateMapping }) => (
    <div data-testid="mock-platform-invite-section">
      <span>PlatformRole: {mapping.invite_role || 'aluno'}</span>
      <button
        type="button"
        onClick={() => updateMapping(0, 'invite_course_access', [{ course_id: 10, access_duration: 'lifetime' }])}
      >
        Selecionar Curso Mock
      </button>
    </div>
  )
}));

vi.mock('../../../pages/Integrations/components/MappingsConfig/BussolaInviteSection', () => ({
  __esModule: true,
  default: ({ mapping, updateMapping }) => (
    <div data-testid="mock-bussola-invite-section">
      <span>BussolaValidity: {mapping.bussola_validity_type || 'never'}</span>
      <button
        type="button"
        onClick={() => updateMapping(0, 'bussola_validity_type', '48h')}
      >
        Alterar Validade Bússola Mock
      </button>
    </div>
  )
}));

describe('EmailTemplateEditModal & EmailHtmlImportPanel Unit Tests', () => {
  const defaultEditorActions = {
    subjectRef: { current: null },
    handleInputChange: vi.fn(),
    handleKeyDown: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('abre no modo Editor Visual por padrão ao criar um novo template e alterna para Importar / Código HTML', () => {
    render(
      <EmailTemplateEditModal
        isOpen={true}
        onClose={vi.fn()}
        editingTemplate={null}
        formData={{ name: '', subject: '', body_html: '' }}
        setFormData={vi.fn()}
        handleSave={vi.fn()}
        onOpenFullscreen={vi.fn()}
        editorActions={defaultEditorActions}
      />
    );

    expect(screen.getByTestId('mock-drag-drop-editor')).toBeInTheDocument();

    const htmlModeBtn = screen.getByRole('button', { name: /Importar \/ Código HTML/i });
    fireEvent.click(htmlModeBtn);

    expect(screen.queryByTestId('mock-drag-drop-editor')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Importar arquivo \.html/i })).toBeInTheDocument();
  });

  it('abre automaticamente no modo Importar / Código HTML ao editar um template com HTML completo customizado', () => {
    const customHtml = '<!DOCTYPE html><html><body><h1>AstroWake</h1></body></html>';
    render(
      <EmailTemplateEditModal
        isOpen={true}
        onClose={vi.fn()}
        editingTemplate={{ id: 1, name: 'AstroWake', subject: 'Bem-vindo', body_html: customHtml }}
        formData={{ name: 'AstroWake', subject: 'Bem-vindo', body_html: customHtml }}
        setFormData={vi.fn()}
        handleSave={vi.fn()}
        onOpenFullscreen={vi.fn()}
        editorActions={defaultEditorActions}
      />
    );

    expect(screen.queryByTestId('mock-drag-drop-editor')).not.toBeInTheDocument();
    expect(screen.getByTitle('Preview do E-mail HTML')).toHaveAttribute('srcdoc', customHtml);
  });

  it('EmailHtmlImportPanel insere variável dinâmica no código HTML na posição do cursor', () => {
    const onChangeHtml = vi.fn();
    render(<EmailHtmlImportPanel bodyHtml="<div>Olá </div>" onChangeHtml={onChangeHtml} />);

    const textarea = screen.getByPlaceholderText(/Cole aqui o código HTML/i);
    textarea.setSelectionRange(9, 9);

    const varBtn = screen.getByRole('button', { name: '{{primeiro_nome}}' });
    fireEvent.click(varBtn);

    expect(onChangeHtml).toHaveBeenCalledWith('<div>Olá {{primeiro_nome}}</div>');
  });

  it('EmailHtmlImportPanel importa conteúdo de arquivo .html e exibe toast de sucesso', async () => {
    const onChangeHtml = vi.fn();
    render(<EmailHtmlImportPanel bodyHtml="" onChangeHtml={onChangeHtml} />);

    const fileInput = screen.getByTestId('html-file-input');
    const htmlContent = '<!DOCTYPE html><html><body><p>AstroWake Boas-vindas</p></body></html>';
    const file = new File([htmlContent], 'boas_vindas.html', { type: 'text/html' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(onChangeHtml).toHaveBeenCalledWith(htmlContent);
      expect(mockToastSuccess).toHaveBeenCalledWith('Arquivo "boas_vindas.html" importado com sucesso!');
    });
  });

  it('EmailHtmlImportPanel alterna visibilidade do Preview ao Vivo', () => {
    render(<EmailHtmlImportPanel bodyHtml="<p>Teste</p>" onChangeHtml={vi.fn()} />);

    expect(screen.getByTitle('Preview do E-mail HTML')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Ocultar Preview/i }));
    expect(screen.queryByTitle('Preview do E-mail HTML')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Mostrar Preview/i }));
    expect(screen.getByTitle('Preview do E-mail HTML')).toBeInTheDocument();
  });

  it('abre no modo Editor Visual ao editar template criado pelo Editor Drag & Drop (mesmo com DOCTYPE)', () => {
    const dragDropHtml =
      '<!DOCTYPE html><html lang="pt-BR"><head><title>E-mail Marketing</title></head>' +
      '<body><div>Parabéns ASTROWAKE!</div><div data-block-type="footer">Rodapé</div></body></html>';

    render(
      <EmailTemplateEditModal
        isOpen={true}
        onClose={vi.fn()}
        editingTemplate={{ id: 9, name: 'Boas Vinda - Comunidade Astrowake', subject: 'Boas Vinda', body_html: dragDropHtml }}
        formData={{ name: 'Boas Vinda - Comunidade Astrowake', subject: 'Boas Vinda', body_html: dragDropHtml }}
        setFormData={vi.fn()}
        handleSave={vi.fn()}
        onOpenFullscreen={vi.fn()}
        editorActions={defaultEditorActions}
      />
    );

    expect(screen.getByTestId('mock-drag-drop-editor')).toBeInTheDocument();
    expect(screen.queryByTitle('Preview do E-mail HTML')).not.toBeInTheDocument();
  });

  it('alterna para a aba Acessos & Convites e atualiza invite_course_access e bussola_validity_type no formData', () => {
    let currentState = {
      name: 'Boas-vindas',
      subject: 'Seu acesso',
      body_html: '<p>{{link_cadastro}}</p>',
      invite_role: 'aluno',
      invite_duration_hours: 0,
      invite_course_access: [],
      bussola_invite_role: 'client',
      bussola_validity_type: 'never',
      bussola_custom_api_key: ''
    };
    const setFormData = vi.fn((updater) => {
      currentState = typeof updater === 'function' ? updater(currentState) : updater;
    });

    render(
      <EmailTemplateEditModal
        isOpen={true}
        onClose={vi.fn()}
        editingTemplate={null}
        formData={currentState}
        setFormData={setFormData}
        handleSave={vi.fn()}
        onOpenFullscreen={vi.fn()}
        editorActions={defaultEditorActions}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Acessos & Convites/i }));

    expect(screen.getByTestId('mock-platform-invite-section')).toBeInTheDocument();
    expect(screen.getByTestId('mock-bussola-invite-section')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Selecionar Curso Mock/i }));
    expect(currentState.invite_course_access).toEqual([{ course_id: 10, access_duration: 'lifetime' }]);

    fireEvent.click(screen.getByRole('button', { name: /Alterar Validade Bússola Mock/i }));
    expect(currentState.bussola_validity_type).toBe('48h');
  });
});
