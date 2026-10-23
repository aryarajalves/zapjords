import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiUserPlus, FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiCheck, FiShield } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { resolveUrl } from '../../../config';

export function CreateUserModal({
    isOpen,
    onClose,
    clients = [],
    currentUser,
    onUserCreated
}) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('admin');
    const [selectedClientIds, setSelectedClientIds] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Garante que ao abrir o modal os campos sempre iniciem 100% vazios
    useEffect(() => {
        if (isOpen) {
            setFullName('');
            setEmail('');
            setPhone('');
            setPassword('');
            setRole('admin');
            setSelectedClientIds([]);
            setShowPassword(false);
        }
    }, [isOpen]);

    // Validação dos 5 Requisitos de Senha em Tempo Real
    const passwordChecks = useMemo(() => {
        const hasMinLen = password.length >= 12;
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);
        const isValid = hasMinLen && hasLower && hasUpper && hasNumber && hasSpecial;

        return {
            hasMinLen,
            hasLower,
            hasUpper,
            hasNumber,
            hasSpecial,
            isValid
        };
    }, [password]);

    if (!isOpen) return null;

    const toggleClient = (clientId) => {
        setSelectedClientIds(prev => 
            prev.includes(clientId) 
                ? prev.filter(id => id !== clientId)
                : [...prev, clientId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!passwordChecks.isValid) {
            toast.error('A senha não cumpre todos os requisitos de segurança.');
            return;
        }

        const cleanDigits = phone.replace(/\D/g, '');
        if (cleanDigits.length < 8) {
            toast.error('Por favor, informe um número de WhatsApp válido.');
            return;
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading('Criando usuário...');

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(resolveUrl('/api/auth/register'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    full_name: fullName.trim(),
                    email: email.trim().toLowerCase(),
                    phone: cleanDigits,
                    password: password,
                    role: role,
                    client_ids: selectedClientIds.length > 0 ? selectedClientIds : clients.map(c => c.id)
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || 'Erro ao criar usuário');
            }

            toast.dismiss(loadingToast);
            toast.success('Usuário criado com sucesso!');
            
            // Limpar formulário
            setFullName('');
            setEmail('');
            setPhone('');
            setPassword('');
            setRole('admin');
            setSelectedClientIds([]);
            
            onClose();
            if (onUserCreated) onUserCreated();
        } catch (err) {
            toast.dismiss(loadingToast);
            console.error('Erro ao registrar usuário:', err);
            toast.error(err.message || 'Não foi possível cadastrar o usuário.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700/70 bg-gray-50/50 dark:bg-gray-800/40 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-inner">
                            <FiUserPlus size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-gray-800 dark:text-white">Criar Novo Usuário</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Cadastro direto com e-mail, WhatsApp e senha segura.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} autoComplete="off" className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                    {/* Campos ocultos para neutralizar o autofill de credenciais do navegador */}
                    <input
                        type="text"
                        name="prevent_autofill_user"
                        style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
                        tabIndex="-1"
                        aria-hidden="true"
                        readOnly
                    />
                    <input
                        type="password"
                        name="prevent_autofill_pwd"
                        style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
                        tabIndex="-1"
                        aria-hidden="true"
                        readOnly
                    />

                    {/* Nome Completo */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                            <FiUser className="text-blue-500" />
                            Nome do Contato / Usuário <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="new_contact_full_name"
                            autoComplete="off"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Ex: João da Silva"
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                        />
                    </div>

                    {/* Email e WhatsApp */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                                <FiMail className="text-purple-500" />
                                E-mail de Acesso <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                inputMode="email"
                                name="new_contact_access_email"
                                id="new_contact_access_email"
                                autoComplete="new-password"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="joao@exemplo.com"
                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                                <FiPhone className="text-emerald-500" />
                                WhatsApp / Telefone <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="new_contact_access_phone"
                                autoComplete="off"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Ex: 5511999998888"
                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                            />
                        </div>
                    </div>

                    {/* Senha com visualização */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                <FiLock className="text-amber-500" />
                                Senha de Acesso <span className="text-rose-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowPassword(prev => !prev)}
                                className="text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                            >
                                {showPassword ? <FiEyeOff size={12} /> : <FiEye size={12} />}
                                <span>{showPassword ? 'Ocultar' : 'Ver Senha'}</span>
                            </button>
                        </div>

                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="new_contact_access_password"
                            id="new_contact_access_password"
                            autoComplete="new-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo de 12 caracteres com maiúsculas, números e símbolos"
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                        />

                        {/* Indicadores dos 5 Requisitos de Senha */}
                        <div className="mt-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 space-y-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-1">
                                Requisitos de Senha Forte:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                                <div className={`flex items-center gap-1.5 ${passwordChecks.hasMinLen ? 'text-emerald-500 dark:text-emerald-400 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
                                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${passwordChecks.hasMinLen ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400' : 'bg-gray-200 dark:bg-gray-700/60'}`}>
                                        <FiCheck size={10} />
                                    </span>
                                    <span>Mínimo 12 caracteres</span>
                                </div>

                                <div className={`flex items-center gap-1.5 ${passwordChecks.hasLower ? 'text-emerald-500 dark:text-emerald-400 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
                                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${passwordChecks.hasLower ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400' : 'bg-gray-200 dark:bg-gray-700/60'}`}>
                                        <FiCheck size={10} />
                                    </span>
                                    <span>Letra minúscula (a-z)</span>
                                </div>

                                <div className={`flex items-center gap-1.5 ${passwordChecks.hasUpper ? 'text-emerald-500 dark:text-emerald-400 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
                                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${passwordChecks.hasUpper ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400' : 'bg-gray-200 dark:bg-gray-700/60'}`}>
                                        <FiCheck size={10} />
                                    </span>
                                    <span>Letra maiúscula (A-Z)</span>
                                </div>

                                <div className={`flex items-center gap-1.5 ${passwordChecks.hasNumber ? 'text-emerald-500 dark:text-emerald-400 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
                                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${passwordChecks.hasNumber ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400' : 'bg-gray-200 dark:bg-gray-700/60'}`}>
                                        <FiCheck size={10} />
                                    </span>
                                    <span>Número (0-9)</span>
                                </div>

                                <div className={`flex items-center gap-1.5 sm:col-span-2 ${passwordChecks.hasSpecial ? 'text-emerald-500 dark:text-emerald-400 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
                                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${passwordChecks.hasSpecial ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400' : 'bg-gray-200 dark:bg-gray-700/60'}`}>
                                        <FiCheck size={10} />
                                    </span>
                                    <span>Caractere especial (!, @, #, $, %, etc.)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cargo */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                            <FiShield className="text-blue-500" />
                            Cargo / Nível de Acesso
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold cursor-pointer"
                        >
                            <option value="admin">Administrador (Acesso completo à operação)</option>
                            <option value="seller">Vendedor (Chat e leads atribuídos)</option>
                            <option value="user">Operador / Usuário Padrão</option>
                            {currentUser?.role === 'super_admin' && (
                                <option value="super_admin">Super Administrador (Acesso total multi-cliente)</option>
                            )}
                        </select>
                    </div>

                    {/* Clientes com Acesso */}
                    {clients.length > 0 && (
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                Clientes com Acesso Permitido
                            </label>
                            <div className="max-h-28 overflow-y-auto custom-scrollbar p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 space-y-1.5">
                                {clients.map(c => (
                                    <label key={c.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-lg transition-all cursor-pointer text-xs text-gray-700 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={selectedClientIds.includes(c.id)}
                                            onChange={() => toggleClient(c.id)}
                                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-0 cursor-pointer bg-white dark:bg-gray-700"
                                        />
                                        <span className="font-bold">{c.name}</span>
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400">(ID: {c.id})</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700/70 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold transition-all cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !fullName.trim() || !email.trim() || !phone.trim() || !passwordChecks.isValid}
                            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {isSubmitting ? 'Cadastrando...' : 'Criar Usuário'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
