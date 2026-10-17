import React, { useState } from 'react';
import { FiCompass, FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../../../config';
import { fetchWithAuth } from '../../../../AuthContext';
import { useClient } from '../../../../contexts/ClientContext';

export default function BussolaSettingsSection({ formData, handleChange, visibleFields }) {
  const { activeClient } = useClient();
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestConnection = async () => {
    const apiUrl = (formData.BUSSOLA_API_URL || '').trim();
    const apiKey = (formData.BUSSOLA_API_KEY || '').trim();

    if (!apiUrl) {
      toast.error('Informe a URL da API da Bússola antes de testar.');
      return;
    }
    if (!apiKey) {
      toast.error('Informe a Chave de API da Bússola antes de testar.');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetchWithAuth(
        `${API_URL}/settings/test-bussola-connection`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_url: apiUrl,
            api_key: apiKey,
          }),
        },
        activeClient?.id
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Conexão estabelecida com sucesso!',
          inviteUrl: data.invite_url,
        });
        toast.success('Conexão com a Bússola aprovada com sucesso!');
      } else {
        const errorMsg = data.error || data.detail || `Erro na conexão (Status ${data.status || res.status})`;
        setTestResult({
          success: false,
          message: errorMsg,
        });
        toast.error(errorMsg);
      }
    } catch (err) {
      const msg = err.message || 'Erro inesperado ao testar conexão com a Bússola.';
      setTestResult({
        success: false,
        message: msg,
      });
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4 mb-8 bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-amber-500/10 text-amber-500 dark:text-amber-400 rounded-lg">
            <FiCompass className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              App Bússola Astrológica
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Configure a API do App Bússola para criação automática de convites via Webhooks (<code className="text-amber-500 font-bold">{"{{link_bussola}}"}</code>).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTestConnection}
          disabled={testing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
        >
          {testing ? (
            <>
              <FiLoader size={14} className="animate-spin" />
              <span>Testando...</span>
            </>
          ) : (
            <>
              <FiCheckCircle size={14} />
              <span>Testar Conexão</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        {/* URL da API */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">
            URL Base da API da Bússola
          </label>
          <input
            type="text"
            name="BUSSOLA_API_URL"
            value={formData.BUSSOLA_API_URL || ''}
            onChange={handleChange}
            placeholder="https://api.bussolaastrologica.com.br"
            className="w-full p-2.5 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-all font-mono text-xs bg-white dark:bg-[#111827] text-gray-900 dark:text-white"
            autoComplete="new-password"
            data-lpignore="true"
          />
          <p className="text-[9px] text-gray-400 px-1">
            Ex: https://api.bussolaastrologica.com.br ou http://localhost:8005 (sem barra final).
          </p>
        </div>

        {/* Chave da API (X-API-Key) */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">
            Chave de API da Bússola (Header X-API-Key)
          </label>
          <div className="relative">
            <input
              type="text"
              name="BUSSOLA_API_KEY"
              value={formData.BUSSOLA_API_KEY || ''}
              onChange={handleChange}
              placeholder="bussola_ext_sec_..."
              style={!showKey && !visibleFields?.['BUSSOLA_API_KEY'] ? { WebkitTextSecurity: 'disc' } : {}}
              className="w-full p-2.5 pr-10 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-all font-mono text-xs bg-white dark:bg-[#111827] text-gray-900 dark:text-white"
              autoComplete="new-password"
              data-lpignore="true"
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowKey(!showKey);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-500 transition-colors z-20 cursor-pointer"
              title={showKey ? 'Esconder' : 'Visualizar'}
            >
              {showKey ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
          <p className="text-[9px] text-gray-400 px-1">
            Chave configurada na variável EXTERNAL_API_KEY no backend da Bússola.
          </p>
        </div>
      </div>

      {testResult && (
        <div
          className={`flex items-start gap-2 p-3 rounded-lg text-xs mt-3 ${
            testResult.success
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
              : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40'
          }`}
        >
          {testResult.success ? (
            <FiCheckCircle size={16} className="shrink-0 mt-0.5 text-emerald-500" />
          ) : (
            <FiAlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
          )}
          <div className="space-y-1">
            <span className="font-semibold">{testResult.message}</span>
            {testResult.inviteUrl && (
              <p className="font-mono text-[10px] break-all opacity-90">
                Convite gerado no teste: {testResult.inviteUrl}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
