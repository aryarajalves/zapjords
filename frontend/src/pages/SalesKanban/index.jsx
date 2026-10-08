import React from 'react';
import { useSalesKanban } from './hooks/useSalesKanban';
import { useDragScroll } from './hooks/useDragScroll';
import { KanbanHeader } from './components/KanbanHeader';
import { KanbanColumn } from './components/KanbanColumn';
import { PipelineModal } from './components/PipelineModal';
import { DealModal } from './components/DealModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';

export default function SalesKanban({ onViewChange }) {
    const { isDragging, dragScrollProps } = useDragScroll();
    const {
        pipelines,
        selectedPipelineId,
        setSelectedPipelineId,
        boardData,
        filteredStages,
        isLoading,
        isSyncing,
        searchTerm,
        setSearchTerm,
        isPipelineModalOpen,
        setIsPipelineModalOpen,
        pipelineToEdit,
        setPipelineToEdit,
        isDealModalOpen,
        setIsDealModalOpen,
        dealToEdit,
        setDealToEdit,
        initialStageForNewDeal,
        setInitialStageForNewDeal,
        deleteModal,
        setDeleteModal,
        handleMoveDeal,
        handleSyncHistory,
        handleSavePipeline,
        handleDeletePipeline,
        handleSaveDeal,
        handleDeleteDeal,
        handleOpenChat
    } = useSalesKanban({ onViewChange });

    const openNewPipeline = () => {
        setPipelineToEdit(null);
        setIsPipelineModalOpen(true);
    };

    const openEditPipeline = (pipe) => {
        setPipelineToEdit(pipe);
        setIsPipelineModalOpen(true);
    };

    const openNewDeal = (stageId = null) => {
        setDealToEdit(null);
        setInitialStageForNewDeal(stageId);
        setIsDealModalOpen(true);
    };

    const openEditDeal = (deal) => {
        setDealToEdit(deal);
        setIsDealModalOpen(true);
    };

    const confirmDeleteDeal = (dealId, contactName) => {
        setIsDealModalOpen(false);
        setDeleteModal({
            isOpen: true,
            type: 'deal',
            id: dealId,
            title: 'Excluir Oportunidade?',
            message: `Tem certeza que deseja excluir o lead "${contactName}" deste pipeline?`
        });
    };

    const handleConfirmDelete = async () => {
        if (deleteModal.type === 'deal') {
            await handleDeleteDeal(deleteModal.id);
        } else if (deleteModal.type === 'pipeline') {
            await handleDeletePipeline(deleteModal.id);
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center min-h-[500px]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-xs font-bold text-slate-400">Carregando Kanban de Vendas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-4 md:p-8 flex flex-col h-[calc(100vh-2rem)] overflow-hidden">
            {/* Header com Seletor e Métricas */}
            <KanbanHeader
                pipelines={pipelines}
                selectedPipelineId={selectedPipelineId}
                onSelectPipeline={setSelectedPipelineId}
                boardData={boardData}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onOpenNewPipeline={openNewPipeline}
                onOpenEditPipeline={openEditPipeline}
                onOpenNewDeal={openNewDeal}
                onSyncHistory={handleSyncHistory}
                isSyncing={isSyncing}
            />

            {/* Quadro Kanban com Colunas Horizontais e Scroll por Arraste com Mouse */}
            <div
                {...dragScrollProps}
                data-testid="kanban-drag-scroll-container"
                className={`flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar transition-colors ${
                    isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
                }`}
            >
                <div className="flex items-stretch gap-4 min-w-max h-full pb-2">
                    {filteredStages.map(stage => (
                        <KanbanColumn
                            key={stage.id}
                            stage={stage}
                            onMoveDeal={handleMoveDeal}
                            onOpenNewDeal={openNewDeal}
                            onEditDeal={openEditDeal}
                            onDeleteDeal={confirmDeleteDeal}
                            onOpenChat={handleOpenChat}
                        />
                    ))}

                    {filteredStages.length === 0 && (
                        <div className="w-full flex flex-col items-center justify-center p-12 text-center text-slate-400 bg-slate-900/30 border border-white/5 rounded-3xl">
                            <span className="text-3xl mb-2">📋</span>
                            <h3 className="text-sm font-bold text-white">Nenhum estágio encontrado</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Crie colunas ou sincronize o pipeline para começar a movimentar oportunidades.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modais */}
            <PipelineModal
                isOpen={isPipelineModalOpen}
                onClose={() => setIsPipelineModalOpen(false)}
                onSave={handleSavePipeline}
                pipelineToEdit={pipelineToEdit}
            />

            <DealModal
                isOpen={isDealModalOpen}
                onClose={() => setIsDealModalOpen(false)}
                onSave={handleSaveDeal}
                onDelete={confirmDeleteDeal}
                dealToEdit={dealToEdit}
                stages={boardData?.stages || []}
                pipelineId={selectedPipelineId}
                initialStageId={initialStageForNewDeal}
                defaultDealValue={boardData?.pipeline?.default_value}
            />

            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                title={deleteModal.title}
                message={deleteModal.message}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteModal({ isOpen: false, type: null, id: null, title: '', message: '' })}
                isProcessing={false}
            />
        </div>
    );
}
