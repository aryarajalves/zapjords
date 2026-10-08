import React, { useState, useEffect } from 'react';
import { FiUserPlus, FiPlus, FiTrash2, FiClock, FiBookOpen, FiInfo, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { API_URL } from '../../../../config';
import { fetchWithAuth } from '../../../../AuthContext';
import { useClient } from '../../../../contexts/ClientContext';

const ACCESS_DURATION_OPTIONS = [
  { value: 'lifetime', label: 'Vitalício (Sem expirar)' },
  { value: '1_month', label: '1 Mês (30 dias)' },
  { value: '3_months', label: '3 Meses (90 dias)' },
  { value: '6_months', label: '6 Meses (180 dias)' },
  { value: '1_year', label: '1 Ano (365 dias)' },
  { value: '2_years', label: '2 Anos (730 dias)' },
  { value: '3_years', label: '3 Anos (1095 dias)' },
];

export default function PlatformInviteSection({ mapping, mIndex, updateMapping }) {
  const { activeClient } = useClient();
  const isAutoInvite = Boolean(mapping.auto_create_invite);
  const courseAccess = Array.isArray(mapping.invite_course_access) ? mapping.invite_course_access : [];

  const [platformCourses, setPlatformCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [coursesMessage, setCoursesMessage] = useState(null);
  const [manualMode, setManualMode] = useState({});

  const fetchCourses = async () => {
    if (!activeClient?.id) return;
    setLoadingCourses(true);
    setCoursesMessage(null);
    try {
      const res = await fetchWithAuth(`${API_URL}/settings/platform-courses`, {}, activeClient.id);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.courses)) {
        setPlatformCourses(data.courses);
        if (data.courses.length === 0) {
          setCoursesMessage('Nenhum curso cadastrado retornado pela plataforma.');
        }
      } else {
        setCoursesMessage(data.message || 'Configure a URL e Token nas Configurações para listar os cursos.');
      }
    } catch (err) {
      setCoursesMessage('Não foi possível conectar à plataforma para listar cursos.');
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    if (isAutoInvite && platformCourses.length === 0) {
      fetchCourses();
    }
  }, [isAutoInvite, activeClient?.id]);

  const handleAddCourse = () => {
    const defaultCourseId = platformCourses.length > 0 ? platformCourses[0].id : 1;
    const newCourse = { course_id: defaultCourseId, access_duration: 'lifetime' };
    const updated = [...courseAccess, newCourse];
    updateMapping(mIndex, 'invite_course_access', updated);
  };

  const handleRemoveCourse = (indexToRemove) => {
    const updated = courseAccess.filter((_, idx) => idx !== indexToRemove);
    updateMapping(mIndex, 'invite_course_access', updated);
  };

  const handleCourseChange = (index, field, value) => {
    const updated = courseAccess.map((item, idx) => {
      if (idx === index) {
        return {
          ...item,
          [field]: field === 'course_id' ? (parseInt(value, 10) || '') : value
        };
      }
      return item;
    });
    updateMapping(mIndex, 'invite_course_access', updated);
  };

  const currentRole = mapping.invite_role || 'aluno';

  return (
    <div className="pt-6 border-t border-gray-50 dark:border-slate-800">
      <div className="bg-emerald-500/5 dark:bg-emerald-500/[0.03] border border-emerald-500/10 rounded-2xl p-5 space-y-4">
        {/* Cabeçalho do Card */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
              <FiUserPlus size={16} />
            </div>
            <div>
              <h5 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
                Criação Automática de Acesso (Área de Membros)
              </h5>
              <p className="text-[9px] text-gray-500">
                Gere o link de convite único e envie direto no WhatsApp via variável <code className="text-emerald-500 font-bold">{"{{link_cadastro}}"}</code>
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isAutoInvite}
              onChange={(e) => updateMapping(mIndex, 'auto_create_invite', e.target.checked)}
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Conteúdo Aberto quando Ativo */}
        {isAutoInvite && (
          <div className="space-y-4 pt-2 animate-in slide-in-from-top-2 duration-300">
            {/* Linha de Configurações Básicas: Role e Duração */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Função / Papel com Seletor Visual Pill para eliminar bug de fundo branco */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">
                  Função / Papel do Usuário
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-white dark:bg-[#0b1120] border border-gray-100 dark:border-white/5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => updateMapping(mIndex, 'invite_role', 'aluno')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                      currentRole === 'aluno'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    Aluno (Padrão)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateMapping(mIndex, 'invite_role', 'admin')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                      currentRole === 'admin'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    Administrador
                  </button>
                </div>
              </div>

              {/* Duração do Link */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-1">
                  <FiClock size={11} className="text-emerald-500" />
                  Validade do Link de Convite (Horas)
                </label>
                <input
                  type="number"
                  min="0"
                  value={mapping.invite_duration_hours !== undefined && mapping.invite_duration_hours !== null ? mapping.invite_duration_hours : 0}
                  onChange={(e) => updateMapping(mIndex, 'invite_duration_hours', parseInt(e.target.value, 10) || 0)}
                  placeholder="0 = Indefinido / Nunca Expira"
                  className="w-full bg-white dark:bg-[#0b1120] border border-gray-100 dark:border-white/5 rounded-xl px-3 py-2 text-[11px] font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-1 focus:ring-emerald-500/30 shadow-inner"
                />
                <p className="text-[8px] text-gray-400 px-1">0 = Nunca expira. Ex: 24 (1 dia), 48 (2 dias), 168 (7 dias).</p>
              </div>
            </div>

            {/* Seção de Cursos Vinculados */}
            <div className="space-y-2 pt-2 border-t border-emerald-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                    <FiBookOpen size={11} className="text-emerald-500" />
                    Cursos Liberados no Cadastro ({courseAccess.length})
                  </label>
                  {platformCourses.length > 0 && (
                    <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {platformCourses.length} curso(s) disponíveis
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchCourses}
                    disabled={loadingCourses}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer"
                    title="Atualizar lista de cursos da plataforma"
                  >
                    <FiRefreshCw size={11} className={loadingCourses ? 'animate-spin' : ''} />
                    <span>{loadingCourses ? 'Atualizando...' : 'Recarregar Cursos'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddCourse}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors cursor-pointer border border-emerald-500/20"
                  >
                    <FiPlus size={12} />
                    <span>Adicionar Curso</span>
                  </button>
                </div>
              </div>

              {/* Mensagem de aviso se não encontrou cursos */}
              {coursesMessage && platformCourses.length === 0 && (
                <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl text-[10px]">
                  <FiAlertCircle size={14} className="shrink-0" />
                  <span>{coursesMessage} Você ainda pode digitar o ID do curso manualmente.</span>
                </div>
              )}

              {courseAccess.length === 0 ? (
                <div className="p-3 text-center rounded-xl bg-white/40 dark:bg-black/20 border border-dashed border-gray-200 dark:border-white/10 text-[10px] text-gray-400">
                  Nenhum curso vinculado. Clique em <span className="text-emerald-500 font-semibold cursor-pointer" onClick={handleAddCourse}>Adicionar Curso</span> para escolher um curso para o aluno.
                </div>
              ) : (
                <div className="space-y-2">
                  {courseAccess.map((course, idx) => {
                    const isManual = manualMode[idx];
                    return (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row items-center gap-2 p-2.5 bg-white dark:bg-[#0b1120] border border-gray-100 dark:border-white/5 rounded-xl shadow-sm"
                      >
                        {/* Seletor / Dropdown de Cursos */}
                        <div className="w-full sm:w-1/2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black uppercase text-gray-400 tracking-wider">
                              Curso da Plataforma
                            </span>
                            {platformCourses.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setManualMode(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                className="text-[8px] text-emerald-500 hover:underline"
                              >
                                {isManual ? 'Selecionar da Lista' : 'Digitar ID Manual'}
                              </button>
                            )}
                          </div>

                          {platformCourses.length > 0 && !isManual ? (
                            <select
                              value={course.course_id ?? ''}
                              onChange={(e) => handleCourseChange(idx, 'course_id', e.target.value)}
                              className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-1 focus:ring-emerald-500/30"
                            >
                              <option value="" className="bg-[#0b1120] text-gray-400">
                                -- Selecione um Curso --
                              </option>
                              {platformCourses.map((c) => (
                                <option key={c.id} value={c.id} className="bg-[#0b1120] text-gray-200">
                                  {c.title} (ID: {c.id})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="number"
                              min="1"
                              value={course.course_id ?? ''}
                              onChange={(e) => handleCourseChange(idx, 'course_id', e.target.value)}
                              placeholder="Digite o ID do curso (ex: 1)"
                              className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-1 focus:ring-emerald-500/30"
                            />
                          )}
                        </div>

                        {/* Tempo de Acesso */}
                        <div className="w-full sm:flex-1 space-y-1">
                          <span className="text-[8px] font-black uppercase text-gray-400 tracking-wider">
                            Tempo de Acesso
                          </span>
                          <select
                            value={course.access_duration || 'lifetime'}
                            onChange={(e) => handleCourseChange(idx, 'access_duration', e.target.value)}
                            className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-1 focus:ring-emerald-500/30"
                          >
                            {ACCESS_DURATION_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value} className="bg-[#0b1120] text-gray-200">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Botão Remover */}
                        <button
                          type="button"
                          onClick={() => handleRemoveCourse(idx)}
                          className="p-2 text-rose-500 hover:text-rose-600 rounded-lg hover:bg-rose-500/10 transition-colors mt-3 sm:mt-4 cursor-pointer"
                          title="Remover Curso"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dica Informativa */}
            <div className="flex items-start gap-2 p-3 bg-emerald-500/10 rounded-xl text-emerald-700 dark:text-emerald-300 text-[10px]">
              <FiInfo size={14} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Como usar no WhatsApp:</span> Configure suas mensagens ou templates contendo a variável <code className="bg-emerald-600/20 px-1 py-0.5 rounded font-mono font-bold">{"{{link_cadastro}}"}</code>. Quando o webhook for acionado, o link com token único será gerado e enviado na hora para o cliente!
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
