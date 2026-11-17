import React, { useState } from 'react';
import {
  FiCompass,
  FiClock,
  FiInfo,
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
  FiPlay
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../../../config';
import { fetchWithAuth } from '../../../../AuthContext';
import { useClient } from '../../../../contexts/ClientContext';

const VALIDITY_OPTIONS = [
  { value: 'never', label: 'Vitalício (Sem expirar - Padrão)' },
  { value: '24h', label: '24 Horas (1 dia)' },
  { value: '48h', label: '48 Horas (2 dias)' },
  { value: '72h', label: '72 Horas (3 dias)' },
];

export default function BussolaInviteSection({ mapping, mIndex, updateMapping, compact = false }) {
  const { activeClient } = useClient();
  const isAutoInvite = Boolean(mapping.bussola_auto_create_invite);
  const currentRole = mapping.bussola_invite_role || 'client';
  const currentValidity = mapping.bussola_validity_type || 'never';
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestInvite = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetchWithAuth(
        `${API_URL}/settings/test-bussola-connection`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_url: null,
            api_key: null,
            role: currentRole,
            validity_type: currentValidity,
          }),
        },
        activeClient?.id
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Link de convite gerado com sucesso!',
          inviteUrl: data.invite_url,
        });
        toast.success('Link de convite da Bússola gerado com sucesso!');
      } else {
        const errorMsg = data.error || data.detail || `Erro ao gerar link (Status ${data.status || res.status})`;
        setTestResult({
          success: false,
          message: errorMsg,
        });
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Erro de rede ao tentar testar a geração de link da Bússola.';
      setTestResult({ success: false, message: errorMsg });
      toast.error(errorMsg);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="pt-6 border-t border-gray-50 dark:border-slate-800">
      <div className="bg-amber-500/5 dark:bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl p-5 space-y-4">
        {/* Cabeçalho do Card */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500">
              <FiCompass size={16} />
            </div>
            <div>
              <h5 className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tight">
                Criação Automática de Acesso (App Bússola Astrológica)
              </h5>
              <p className="text-[9px] text-gray-500">
                Gere o link de convite único da Bússola e envie no WhatsApp via variável <code className="text-amber-500 font-bold">{"{{link_bussola}}"}</code>
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isAutoInvite}
              onChange={(e) => updateMapping(mIndex, 'bussola_auto_create_invite', e.target.checked)}
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {/* Conteúdo Aberto quando Ativo */}
        {isAutoInvite && (
          <div className="space-y-4 pt-2 animate-in slide-in-from-top-2 duration-300">
            {/* Linha de Configurações Básicas: Role e Validade */}
            <div className={`grid grid-cols-1 ${compact ? '' : 'md:grid-cols-2'} gap-4`}>
              {/* Função / Papel */}
              <div className="space-y-1.5 min-w-0">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">
                  Função / Papel do Usuário
                </label>
                <div className="flex flex-wrap gap-1.5 p-1 bg-white dark:bg-[#0b1120] border border-gray-100 dark:border-white/5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => updateMapping(mIndex, 'bussola_invite_role', 'client')}
                    className={`flex-1 min-w-[100px] py-1.5 px-2.5 rounded-lg text-[11px] leading-tight font-bold transition-all text-center whitespace-nowrap cursor-pointer ${
                      currentRole === 'client'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    Aluno (Padrão)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateMapping(mIndex, 'bussola_invite_role', 'admin')}
                    className={`flex-1 min-w-[100px] py-1.5 px-2.5 rounded-lg text-[11px] leading-tight font-bold transition-all text-center whitespace-nowrap cursor-pointer ${
                      currentRole === 'admin'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    Administrador
                  </button>
                </div>
              </div>

              {/* Validade do Convite */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-1">
                  <FiClock size={11} className="text-amber-500" />
                  Validade do Link de Convite
                </label>
                <select
                  value={currentValidity}
                  onChange={(e) => updateMapping(mIndex, 'bussola_validity_type', e.target.value)}
                  className="w-full bg-white dark:bg-[#0b1120] border border-gray-100 dark:border-white/5 rounded-xl px-3 py-2 text-[11px] font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-1 focus:ring-amber-500/30 shadow-inner"
                >
                  {VALIDITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#0b1120] text-gray-200">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[8px] text-gray-400 px-1">
                  Tempo que o aluno tem para acessar o link e concluir o cadastro.
                </p>
              </div>
            </div>

            {/* Botão e Feedback de Teste de Geração de Convite */}
            <div className="pt-2 border-t border-amber-500/10 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  Valide se o ZapVoice consegue gerar um link real usando a URL/chave das Configurações e o papel/validade deste gatilho.
                </p>
                <button
                  type="button"
                  onClick={handleTestInvite}
                  disabled={testing}
                  className="px-3.5 py-2 rounded-xl text-[11px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {testing ? <FiLoader size={13} className="animate-spin" /> : <FiPlay size={13} />}
                  {testing ? 'Gerando Link de Teste...' : 'Testar Geração de Link'}
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-[11px] flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <FiCheckCircle size={15} className="shrink-0 mt-0.5 text-emerald-500" />
                  ) : (
                    <FiAlertCircle size={15} className="shrink-0 mt-0.5 text-rose-500" />
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-bold">{testResult.message}</p>
                    {testResult.inviteUrl && (
                      <p className="text-[10px] font-mono break-all opacity-90">
                        Link gerado: {testResult.inviteUrl}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dica Informativa */}
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-xl text-amber-700 dark:text-amber-300 text-[10px]">
              <FiInfo size={14} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Como usar no WhatsApp:</span> Configure suas mensagens ou templates contendo a variável <code className="bg-amber-600/20 px-1 py-0.5 rounded font-mono font-bold">{"{{link_bussola}}"}</code>. Quando o webhook for acionado, o link com token único será gerado pela API do App Bússola e enviado na hora para o cliente!
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
