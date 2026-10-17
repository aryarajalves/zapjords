import React, { useState } from 'react';
import { FiCompass, FiClock, FiKey, FiInfo, FiEye, FiEyeOff } from 'react-icons/fi';

const VALIDITY_OPTIONS = [
  { value: 'never', label: 'Vitalício (Sem expirar - Padrão)' },
  { value: '24h', label: '24 Horas (1 dia)' },
  { value: '48h', label: '48 Horas (2 dias)' },
  { value: '72h', label: '72 Horas (3 dias)' },
];

export default function BussolaInviteSection({ mapping, mIndex, updateMapping }) {
  const isAutoInvite = Boolean(mapping.bussola_auto_create_invite);
  const currentRole = mapping.bussola_invite_role || 'client';
  const currentValidity = mapping.bussola_validity_type || 'never';
  const [showKey, setShowKey] = useState(false);

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Função / Papel */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">
                  Função / Papel do Usuário
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-white dark:bg-[#0b1120] border border-gray-100 dark:border-white/5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => updateMapping(mIndex, 'bussola_invite_role', 'client')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
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
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
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

            {/* Chave de API Opcional (Sobrescrita) */}
            <div className="space-y-1.5 pt-2 border-t border-amber-500/10">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <FiKey size={11} className="text-amber-500" />
                API Key Personalizada da Bússola <span className="font-normal text-gray-500">(Opcional)</span>
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={mapping.bussola_custom_api_key || ''}
                  onChange={(e) => updateMapping(mIndex, 'bussola_custom_api_key', e.target.value)}
                  placeholder="Deixe em branco para usar a chave padrão das Configurações"
                  className="w-full bg-white dark:bg-[#0b1120] border border-gray-100 dark:border-white/5 rounded-xl px-3 py-2 pr-10 text-[11px] font-mono text-gray-700 dark:text-gray-200 outline-none focus:ring-1 focus:ring-amber-500/30 shadow-inner"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-500 transition-colors cursor-pointer"
                  title={showKey ? 'Esconder' : 'Visualizar'}
                >
                  {showKey ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                </button>
              </div>
              <p className="text-[8px] text-gray-400 px-1">
                Caso queira usar uma chave da Bússola diferente da cadastrada globalmente nas Configurações.
              </p>
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
