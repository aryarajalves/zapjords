import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiX, FiCheck, FiPlus, FiHelpCircle } from 'react-icons/fi';
import { API_URL } from '../../../config';
import { fetchWithAuth } from '../../../AuthContext';
import { useClient } from '../../../contexts/ClientContext';
import useScrollLock from '../../../hooks/useScrollLock';
import TriggerButtonItem from './TriggerButtonItem';

export default function TriggerButtonActionsModal({ trigger, onClose, onSaved }) {
  useScrollLock(true);
  const { activeClient } = useClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateButtons, setTemplateButtons] = useState([]);
  const [buttonActions, setButtonActions] = useState({});
  const [funnels, setFunnels] = useState([]);
  const [newButtonText, setNewButtonText] = useState('');

  useEffect(() => {
    if (!trigger?.id) return;
    let isMounted = true;

    async function loadInfo() {
      try {
        setLoading(true);
        const res = await fetchWithAuth(`${API_URL}/triggers/${trigger.id}/button-actions-info`, {}, activeClient?.id);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Falha ao carregar informações dos botões.');
        }
        const data = await res.json();
        if (!isMounted) return;

        setFunnels(Array.isArray(data.funnels) ? data.funnels : []);

        const rawActions = data.button_actions || data.current_button_actions || {};
        const buttonsFromTpl = Array.isArray(data.template_buttons) 
          ? data.template_buttons 
          : (Array.isArray(data.discovered_buttons) ? data.discovered_buttons : []);
        const buttonsFromActions = Object.keys(rawActions);
        const uniqueButtons = Array.from(new Set([...buttonsFromTpl, ...buttonsFromActions]));

        setTemplateButtons(uniqueButtons);

        // Inicializar ações
        const initialActions = {};
        uniqueButtons.forEach((btn) => {
          const act = rawActions[btn];
          if (act) {
            initialActions[btn] = {
              type: act.type || 'none',
              funnel_id: act.funnel_id ? String(act.funnel_id) : '',
              enable_ai: Boolean(act.enable_ai)
            };
          } else {
            initialActions[btn] = {
              type: 'none',
              funnel_id: '',
              enable_ai: false
            };
          }
        });
        setButtonActions(initialActions);
      } catch (err) {
        console.error('Erro ao carregar dados dos botões:', err);
        toast.error(err.message || 'Erro ao carregar botões do disparo.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadInfo();
    return () => { isMounted = false; };
  }, [trigger?.id]);

  const handleActionTypeChange = (btn, newType) => {
    setButtonActions((prev) => ({
      ...prev,
      [btn]: {
        ...prev[btn],
        type: newType,
        funnel_id: newType === 'none' ? '' : prev[btn]?.funnel_id || ''
      }
    }));
  };

  const handleFunnelChange = (btn, funnelId) => {
    setButtonActions((prev) => ({
      ...prev,
      [btn]: {
        ...prev[btn],
        funnel_id: funnelId
      }
    }));
  };

  const handleToggleAi = (btn) => {
    setButtonActions((prev) => ({
      ...prev,
      [btn]: {
        ...prev[btn],
        enable_ai: !prev[btn]?.enable_ai
      }
    }));
  };

  const handleAddCustomButton = (e) => {
    e.preventDefault();
    const trimmed = newButtonText.trim();
    if (!trimmed) return;
    if (templateButtons.includes(trimmed)) {
      toast.error('Este botão já existe na lista.');
      return;
    }
    setTemplateButtons((prev) => [...prev, trimmed]);
    setButtonActions((prev) => ({
      ...prev,
      [trimmed]: { type: 'none', funnel_id: '', enable_ai: false }
    }));
    setNewButtonText('');
  };

  const handleRemoveButton = (btn) => {
    setTemplateButtons((prev) => prev.filter((b) => b !== btn));
    setButtonActions((prev) => {
      const next = { ...prev };
      delete next[btn];
      return next;
    });
  };

  const handleSave = async () => {
    // Validações
    for (const btn of templateButtons) {
      const action = buttonActions[btn];
      if (action && action.type === 'interaction' && !action.funnel_id) {
        toast.error(`Selecione um funil para a ação de interação do botão "${btn}".`);
        return;
      }
    }

    try {
      setSaving(true);
      const payloadActions = {};
      templateButtons.forEach((btn) => {
        const act = buttonActions[btn];
        if (act && act.type && act.type !== 'none') {
          payloadActions[btn] = {
            type: act.type,
            funnel_id: act.funnel_id ? parseInt(act.funnel_id, 10) : null,
            enable_ai: Boolean(act.enable_ai)
          };
        }
      });

      const res = await fetchWithAuth(
        `${API_URL}/triggers/${trigger.id}/button-actions`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ button_actions: payloadActions })
        },
        activeClient?.id
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Falha ao salvar ações dos botões.');
      }

      const data = await res.json();
      toast.success('Ações dos botões atualizadas com sucesso!');
      if (onSaved) onSaved(data.button_actions);
      onClose();
    } catch (err) {
      console.error('Erro ao salvar ações dos botões:', err);
      toast.error(err.message || 'Erro ao salvar ações.');
    } finally {
      setSaving(false);
    }
  };

  const templateDisplay = trigger?.template_name?.split('|').pop() || trigger?.template_name || 'Disparo';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Conectar Funis e Ações aos Botões
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                #{trigger?.id}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Template: <span className="font-semibold text-slate-700 dark:text-slate-300">{templateDisplay}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Fechar"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Instruções */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/30 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
            <FiHelpCircle className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" size={16} />
            <div>
              <span className="font-bold">Como funciona:</span> Quando o contato responder clicando em um botão da mensagem enviada, o sistema executará a ação configurada abaixo (contabilizar interação, acionar o funil conectado ou bloquear o contato).
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium">Carregando botões do template e funis...</span>
            </div>
          ) : (
            <>
              {templateButtons.length === 0 ? (
                <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                  Nenhum botão foi detectado automaticamente neste template. Adicione o texto exato do botão abaixo para vinculá-lo.
                </div>
              ) : (
                <div className="space-y-4">
                  {templateButtons.map((btn) => (
                    <TriggerButtonItem
                      key={btn}
                      btn={btn}
                      action={buttonActions[btn]}
                      funnels={funnels}
                      onActionTypeChange={handleActionTypeChange}
                      onFunnelChange={handleFunnelChange}
                      onToggleAi={handleToggleAi}
                      onRemove={handleRemoveButton}
                    />
                  ))}
                </div>
              )}

              {/* Adicionar Botão Customizado */}
              <form onSubmit={handleAddCustomButton} className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <input
                  type="text"
                  placeholder="Nome de outro botão do template..."
                  value={newButtonText}
                  onChange={(e) => setNewButtonText(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={!newButtonText.trim()}
                  className="px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition flex items-center gap-1 cursor-pointer"
                >
                  <FiPlus size={14} />
                  <span>Adicionar</span>
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || saving}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1.5 shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <FiCheck size={14} />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
