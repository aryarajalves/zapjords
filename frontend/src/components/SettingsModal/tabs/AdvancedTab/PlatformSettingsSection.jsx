import React, { useState } from 'react';
import { FiGlobe, FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../../../config';
import { fetchWithAuth } from '../../../../AuthContext';
import { useClient } from '../../../../contexts/ClientContext';

export default function PlatformSettingsSection({ formData, handleChange, visibleFields }) {
  const { activeClient } = useClient();
  const [showToken, setShowToken] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestConnection = async () => {
    const apiUrl = (formData.PLATFORM_API_URL || '').trim();
    const apiToken = (formData.PLATFORM_API_TOKEN || '').trim();

    if (!apiUrl) {
      toast.error('Informe a URL da plataforma antes de testar.');
      return;
    }
    if (!apiToken) {
      toast.error('Informe o Token da plataforma antes de testar.');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetchWithAuth(
        `${API_URL}/settings/test-platform-connection`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_url: apiUrl,
            api_token: apiToken,
          }),
        },
        activeClient?.id
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Conexão estabelecida com sucesso!',
          coursesCount: Array.isArray(data.courses) ? data.courses.length : 0,
        });
        toast.success(`Conexão aprovada! ${data.courses?.length || 0} curso(s) disponível(is).`);
      } else {
        const errorMsg = data.error || data.detail || `Erro na conexão (Status ${data.status || res.status})`;
        setTestResult({
          success: false,
          message: errorMsg,
        });
        toast.error(errorMsg);
      }
    } catch (err) {
      const msg = err.message || 'Erro inesperado ao testar conexão.';
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
          <span className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <FiGlobe className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              Plataforma Externa (Área de Membros)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Conecte sua plataforma de cursos para geração de links e criação de contas via Webhooks.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTestConnection}
          disabled={testing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
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

      {/* Inputs invisíveis para desviar autofill indevido do gerenciador de senhas do navegador */}
      <div className="hidden" aria-hidden="true">
        <input type="text" name="chrome_prevent_autofill_username" tabIndex="-1" autoComplete="new-password" />
        <input type="password" name="chrome_prevent_autofill_password" tabIndex="-1" autoComplete="new-password" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        {/* URL da API */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">
            URL Base da Plataforma
          </label>
          <input
            type="text"
            name="PLATFORM_API_URL"
            value={formData.PLATFORM_API_URL || ''}
            onChange={handleChange}
            placeholder="https://suaplataforma.com.br"
            className="w-full p-2.5 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-xs bg-white dark:bg-[#111827] text-gray-900 dark:text-white"
            autoComplete="new-password"
            data-lpignore="true"
            data-form-type="other"
          />
          <p className="text-[9px] text-gray-400 px-1">
            Ex: https://seusite.com.br ou http://seu-ip:8010 (sem barra final).
          </p>
        </div>

        {/* Token da API */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">
            Token de API da Plataforma (Chave sk_live_...)
          </label>
          <div className="relative">
            <input
              type="text"
              name="PLATFORM_API_TOKEN"
              value={formData.PLATFORM_API_TOKEN || ''}
              onChange={handleChange}
              placeholder="sk_live_..."
              style={!showToken && !visibleFields?.['PLATFORM_API_TOKEN'] ? { WebkitTextSecurity: 'disc' } : {}}
              className="w-full p-2.5 pr-10 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-xs bg-white dark:bg-[#111827] text-gray-900 dark:text-white"
              autoComplete="new-password"
              data-lpignore="true"
              data-form-type="other"
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowToken(!showToken);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500 transition-colors z-20 cursor-pointer"
              title={showToken ? 'Esconder' : 'Visualizar'}
            >
              {showToken ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
          <p className="text-[9px] text-gray-400 px-1">
            Chave de API gerada na plataforma externa com permissão para criar convites.
          </p>
        </div>
      </div>

      {/* URL de Acesso do Aluno (Frontend da Área de Membros) */}
      <div className="space-y-1.5 mt-2">
        <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">
          URL da Área de Alunos (Frontend) <span className="font-normal text-gray-400">(Opcional)</span>
        </label>
        <input
          type="text"
          name="PLATFORM_FRONTEND_URL"
          value={formData.PLATFORM_FRONTEND_URL || ''}
          onChange={handleChange}
          placeholder="https://membros.seusite.com.br (ou http://localhost:3010 no desenvolvimento)"
          className="w-full p-2.5 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-xs bg-white dark:bg-[#111827] text-gray-900 dark:text-white"
          autoComplete="new-password"
          data-lpignore="true"
          data-form-type="other"
        />
        <p className="text-[9px] text-gray-400 px-1">
          Link da interface web onde os alunos realizam o cadastro. Se não informado, o ZapVoice ajustará automaticamente a porta ou usará a URL base.
        </p>
      </div>

      {/* Feedback do Teste */}
      {testResult && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-xs font-semibold ${
            testResult.success
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
          }`}
        >
          {testResult.success ? (
            <>
              <FiCheckCircle size={16} className="shrink-0" />
              <span>{testResult.message} ({testResult.coursesCount} curso(s) sincronizados).</span>
            </>
          ) : (
            <>
              <FiAlertCircle size={16} className="shrink-0" />
              <span>{testResult.message}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
