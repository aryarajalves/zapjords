import React from 'react';
import { FiTrash2, FiX, FiCheckSquare, FiUsers } from 'react-icons/fi';

const BulkUserActionBar = ({
    selectedCount,
    totalEligibleUsers,
    onSelectAllFiltered,
    onClearSelection,
    onConfirmBulkDelete
}) => {
    if (selectedCount === 0) return null;

    const hasMoreToSelect = totalEligibleUsers > selectedCount;

    return (
        <div className="mb-3 p-3 bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border border-red-500/30 rounded-2xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
                    <FiUsers size={16} />
                </div>
                <div>
                    <div className="text-xs font-black text-white flex items-center gap-2">
                        <span>{selectedCount} usuário(s) selecionado(s)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                            Pronto para exclusão
                        </span>
                    </div>
                    {hasMoreToSelect && (
                        <button
                            type="button"
                            onClick={onSelectAllFiltered}
                            className="text-[11px] text-blue-400 hover:text-blue-300 underline font-semibold cursor-pointer mt-0.5 text-left"
                        >
                            Selecionar todos os {totalEligibleUsers} usuários elegíveis da busca
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                    type="button"
                    onClick={onClearSelection}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer border border-white/5"
                >
                    <FiX size={14} />
                    <span>Desmarcar</span>
                </button>

                <button
                    type="button"
                    onClick={onConfirmBulkDelete}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-black text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all shadow-md shadow-red-600/30 cursor-pointer active:scale-95"
                >
                    <FiTrash2 size={14} />
                    <span>Excluir Selecionados ({selectedCount})</span>
                </button>
            </div>
        </div>
    );
};

export default BulkUserActionBar;
