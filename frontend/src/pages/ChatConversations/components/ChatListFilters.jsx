import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FiSearch, FiTag, FiRefreshCw, FiSlash, FiCalendar, FiClock, FiSliders, FiChevronLeft, FiChevronRight, FiCheckCircle } from 'react-icons/fi';
import ChatLabelFilterDropdown from './ChatLabelFilterDropdown';
import ChatStatusFilterPopover from './ChatStatusFilterPopover';
import ChatOrderFilterPopover from './ChatOrderFilterPopover';

export default function ChatListFilters({
    activeTab,
    setActiveTab,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    selectedLabelFilter,
    setSelectedLabelFilter,
    availableLabels = [],
    availableLabelsDetails = [],
    getLabelColor,
    activeFilterTab,
    setActiveFilterTab,
    filterWindowOpen,
    setFilterWindowOpen,
    filterTemplate24h,
    setFilterTemplate24h,
    filterUnread,
    setFilterUnread,
    filterHasNote,
    setFilterHasNote,
    filterUrgent,
    setFilterUrgent,
    filterHasReplied,
    setFilterHasReplied,
    filterHasActiveFunnel,
    setFilterHasActiveFunnel,
    filterLastMessageRead,
    setFilterLastMessageRead,
    filterLastMessageUnread,
    setFilterLastMessageUnread,
    filterNoPipeline,
    setFilterNoPipeline,
    filterNotInPipelineId,
    setFilterNotInPipelineId,
    filterInPipeline,
    setFilterInPipeline,
    filterPipelineId,
    setFilterPipelineId,
    filterPipelineStageId,
    setFilterPipelineStageId,
    pipelines = [],
    filterBlockStatus,
    setFilterBlockStatus,
    filterStartDate,
    setFilterStartDate,
    filterEndDate,
    setFilterEndDate,
    orderBy = 'recent',
    setOrderBy,
    visibleCount = 0,
    onLabelDropdownOpenChange
}) {
    const filtersContainerRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = useCallback(() => {
        const el = filtersContainerRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }, []);

    useEffect(() => {
        const timer = setTimeout(checkScroll, 100);
        window.addEventListener('resize', checkScroll);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', checkScroll);
        };
    }, [checkScroll]);

    const scrollFilters = (direction) => {
        const el = filtersContainerRef.current;
        if (!el) return;
        const amount = direction === 'left' ? -180 : 180;
        el.scrollBy({ left: amount, behavior: 'smooth' });
        setTimeout(checkScroll, 250);
    };

    const handleFilterTabClick = (fKey, e) => {
        setActiveFilterTab(prev => prev === fKey ? null : fKey);
        if (e && typeof e.currentTarget?.scrollIntoView === 'function') {
            e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            setTimeout(checkScroll, 300);
        }
    };

    const handleWheel = (e) => {
        if (filtersContainerRef.current && e.deltaY !== 0 && !e.shiftKey) {
            e.preventDefault();
            filtersContainerRef.current.scrollLeft += e.deltaY;
            checkScroll();
        }
    };

    return (
        <>
            <div className="p-4 border-b border-gray-200 dark:border-white/5 space-y-3">
                <div className="flex gap-2">
                    {['minha', 'nao_atribuida', 'todos'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                                activeTab === tab
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white dark:bg-[#1e293b] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/5'
                            }`}
                        >
                            {tab === 'nao_atribuida' ? 'Não atrib.' : tab}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-300 text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/5"
                    >
                        <option value="open">Abertas</option>
                        <option value="resolved">Resolvidas</option>
                        <option value="archived">Arquivadas</option>
                        <option value="all">Todas</option>
                    </select>
                    <div className="relative flex-1">
                        <FiSearch size={14} className="absolute left-3 top-2.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Procurar..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-300 text-xs rounded-lg border border-gray-200 dark:border-white/5"
                        />
                    </div>
                </div>
            </div>

            {/* Filtros extra com scroll horizontal suave */}
            <div className="border-b border-gray-200 dark:border-white/5 bg-gray-50/10 dark:bg-black/10 relative">
                <div className="flex items-center px-2 py-2 gap-1 relative">
                    {canScrollLeft && (
                        <button
                            onClick={() => scrollFilters('left')}
                            className="shrink-0 p-1.5 rounded-lg bg-white dark:bg-[#1e293b] text-gray-600 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                            title="Rolar filtros para esquerda"
                            type="button"
                        >
                            <FiChevronLeft size={13} />
                        </button>
                    )}

                    <div
                        ref={filtersContainerRef}
                        onScroll={checkScroll}
                        onWheel={handleWheel}
                        className="flex items-center px-1.5 py-1.5 gap-1.5 overflow-x-auto no-scrollbar scroll-smooth flex-1"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {(() => {
                            const activeStatusCount = [
                                filterWindowOpen,
                                filterTemplate24h,
                                filterUnread,
                                filterHasNote,
                                filterUrgent,
                                filterHasReplied,
                                filterHasActiveFunnel,
                                filterLastMessageRead,
                                filterLastMessageUnread,
                                filterNoPipeline,
                                !!filterNotInPipelineId,
                                filterInPipeline,
                                !!filterPipelineId,
                                !!filterPipelineStageId
                            ].filter(Boolean).length;

                            const filterTabs = [
                                { key: 'marcador', label: 'Marcador', icon: FiTag, active: !!(selectedLabelFilter && (typeof selectedLabelFilter === 'string' ? selectedLabelFilter : selectedLabelFilter.labels?.length > 0)) },
                                { key: 'status', label: activeStatusCount > 0 ? `Status (${activeStatusCount})` : 'Status', icon: FiRefreshCw, active: activeStatusCount > 0 },
                                { 
                                    key: 'bloqueio', 
                                    label: filterBlockStatus === 'unblocked' ? 'Não Bloqueados' : filterBlockStatus === 'blocked' ? 'Bloqueados' : filterBlockStatus === 'resting' ? 'Em Repouso' : 'Bloqueio', 
                                    icon: filterBlockStatus === 'unblocked' ? FiCheckCircle : FiSlash, 
                                    active: !!filterBlockStatus 
                                },
                                { key: 'data', label: 'Data', icon: FiCalendar, active: !!filterStartDate || !!filterEndDate },
                                { key: 'ordem', label: 'Ordem', icon: FiSliders, active: !!orderBy && orderBy !== 'recent' }
                            ];

                            return filterTabs.map(f => (
                                <button
                                    key={f.key}
                                    data-testid={`filter-tab-${f.key}`}
                                    onClick={e => handleFilterTabClick(f.key, e)}
                                    className={`relative shrink-0 min-w-max flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border whitespace-nowrap transition-all ${
                                        activeFilterTab === f.key
                                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                                            : f.active
                                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/35 hover:border-blue-500/50'
                                            : 'bg-white dark:bg-[#1e293b] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10'
                                    }`}
                                >
                                    <f.icon size={12} className="shrink-0" /> <span>{f.label}</span>
                                    {f.active && (
                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white dark:ring-[#111827] shadow-sm" />
                                    )}
                                </button>
                            ));
                        })()}
                        <span className="shrink-0 ml-1 bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap">
                            {visibleCount}
                        </span>
                    </div>

                    {canScrollRight && (
                        <button
                            onClick={() => scrollFilters('right')}
                            className="shrink-0 p-1.5 rounded-lg bg-white dark:bg-[#1e293b] text-gray-600 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                            title="Rolar filtros para direita"
                            type="button"
                        >
                            <FiChevronRight size={13} />
                        </button>
                    )}
                </div>

                {activeFilterTab === 'marcador' && (
                    <div className="px-4 pb-3">
                        <ChatLabelFilterDropdown
                            selectedLabelFilter={selectedLabelFilter}
                            setSelectedLabelFilter={setSelectedLabelFilter}
                            availableLabels={availableLabels}
                            availableLabelsDetails={availableLabelsDetails}
                            getLabelColor={getLabelColor}
                            onOpenChange={onLabelDropdownOpenChange}
                        />
                    </div>
                )}

                {/* Popover Flutuante de Status (não empurra a lista de conversas) */}
                <ChatStatusFilterPopover
                    isOpen={activeFilterTab === 'status'}
                    onClose={() => setActiveFilterTab(null)}
                    filterWindowOpen={filterWindowOpen}
                    setFilterWindowOpen={setFilterWindowOpen}
                    filterTemplate24h={filterTemplate24h}
                    setFilterTemplate24h={setFilterTemplate24h}
                    filterUnread={filterUnread}
                    setFilterUnread={setFilterUnread}
                    filterHasNote={filterHasNote}
                    setFilterHasNote={setFilterHasNote}
                    filterUrgent={filterUrgent}
                    setFilterUrgent={setFilterUrgent}
                    filterHasReplied={filterHasReplied}
                    setFilterHasReplied={setFilterHasReplied}
                    filterHasActiveFunnel={filterHasActiveFunnel}
                    setFilterHasActiveFunnel={setFilterHasActiveFunnel}
                    filterLastMessageRead={filterLastMessageRead}
                    setFilterLastMessageRead={setFilterLastMessageRead}
                    filterLastMessageUnread={filterLastMessageUnread}
                    setFilterLastMessageUnread={setFilterLastMessageUnread}
                    filterNoPipeline={filterNoPipeline}
                    setFilterNoPipeline={setFilterNoPipeline}
                    filterNotInPipelineId={filterNotInPipelineId}
                    setFilterNotInPipelineId={setFilterNotInPipelineId}
                    filterInPipeline={filterInPipeline}
                    setFilterInPipeline={setFilterInPipeline}
                    filterPipelineId={filterPipelineId}
                    setFilterPipelineId={setFilterPipelineId}
                    filterPipelineStageId={filterPipelineStageId}
                    setFilterPipelineStageId={setFilterPipelineStageId}
                    pipelines={pipelines}
                />

                {activeFilterTab === 'bloqueio' && (
                    <div className="px-4 pb-3 flex gap-2">
                        <button
                            onClick={() => setFilterBlockStatus(v => v === 'unblocked' ? null : 'unblocked')}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                filterBlockStatus === 'unblocked'
                                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                    : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-emerald-500/40 hover:text-emerald-400'
                            }`}
                        >
                            <FiCheckCircle size={12} />
                            Não bloqueados
                        </button>

                        <button
                            onClick={() => setFilterBlockStatus(v => v === 'blocked' ? null : 'blocked')}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                filterBlockStatus === 'blocked'
                                    ? 'bg-red-500/20 border-red-500/40 text-red-400'
                                    : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-red-500/40 hover:text-red-400'
                            }`}
                        >
                            <FiSlash size={12} />
                            Bloqueados
                        </button>

                        <button
                            onClick={() => setFilterBlockStatus(v => v === 'resting' ? null : 'resting')}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                filterBlockStatus === 'resting'
                                    ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                                    : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-orange-500/40 hover:text-orange-400'
                            }`}
                        >
                            <FiClock size={12} />
                            Em repouso
                        </button>
                    </div>
                )}

                {activeFilterTab === 'data' && (
                    <div className="px-4 pb-3 space-y-2">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 block mb-1">De</label>
                                <input
                                    type="date"
                                    value={filterStartDate}
                                    onChange={(e) => setFilterStartDate(e.target.value)}
                                    className="w-full bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-300 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/5 focus:outline-none"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 block mb-1">Até</label>
                                <input
                                    type="date"
                                    value={filterEndDate}
                                    onChange={(e) => setFilterEndDate(e.target.value)}
                                    className="w-full bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-300 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/5 focus:outline-none"
                                />
                            </div>
                        </div>
                        {(filterStartDate || filterEndDate) && (
                            <button
                                onClick={() => {
                                    setFilterStartDate('');
                                    setFilterEndDate('');
                                }}
                                className="text-left text-[11px] text-red-500 hover:text-red-600 font-semibold mt-1 block"
                            >
                                Limpar Filtro de Data
                            </button>
                        )}
                    </div>
                )}

                {/* Popover Flutuante de Ordenação (não empurra a lista de conversas) */}
                <ChatOrderFilterPopover
                    isOpen={activeFilterTab === 'ordem'}
                    onClose={() => setActiveFilterTab(null)}
                    orderBy={orderBy}
                    setOrderBy={setOrderBy}
                />
            </div>
        </>
    );
}
