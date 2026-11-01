import React from 'react';
import { FiEdit3, FiUploadCloud, FiTag, FiTrello } from 'react-icons/fi';

const Tabs = ({ mode, setMode }) => {
    return (
        <div className="flex justify-center mb-8">
            <div className="bg-black/40 p-1.5 rounded-2xl inline-flex relative w-full max-w-xl border border-white/5 shadow-inner">
                <button
                    onClick={() => setMode('manual')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 relative z-10 ${mode === 'manual'
                        ? 'text-white shadow-lg shadow-emerald-900/20 bg-slate-800 border border-white/5'
                        : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <FiEdit3 size={15} />
                    Manual
                </button>
                <button
                    onClick={() => setMode('upload')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 relative z-10 ${mode === 'upload'
                        ? 'text-white shadow-lg shadow-emerald-900/20 bg-slate-800 border border-white/5'
                        : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <FiUploadCloud size={15} />
                    Upload
                </button>
                <button
                    onClick={() => setMode('tag')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 relative z-10 ${mode === 'tag'
                        ? 'text-white shadow-lg shadow-emerald-900/20 bg-slate-800 border border-white/5'
                        : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <FiTag size={15} />
                    Etiquetas
                </button>
                <button
                    onClick={() => setMode('kanban')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 relative z-10 ${mode === 'kanban'
                        ? 'text-white shadow-lg shadow-indigo-900/20 bg-indigo-600/80 border border-indigo-400/30'
                        : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <FiTrello size={15} />
                    Kanban
                </button>
            </div>
        </div>
    );
};

export default Tabs;
