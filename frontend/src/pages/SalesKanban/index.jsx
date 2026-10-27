import React, { useState, useMemo } from 'react';
import { FiPlus } from 'react-icons/fi';
import { useSalesKanban } from './hooks/useSalesKanban';
import { useDragScroll } from './hooks/useDragScroll';
import { useCrmProducts } from './hooks/useCrmProducts';
import { useBulkDeals } from './hooks/useBulkDeals';
import { useClient } from '../../contexts/ClientContext';
import { KanbanHeader } from './components/KanbanHeader';
import { KanbanColumn } from './components/KanbanColumn';
import { BulkActionsBar } from './components/BulkActionsBar';
import { BulkEditDealsModal } from './components/BulkEditDealsModal';
import { PipelineModal } from './components/PipelineModal';
import { StageModal } from './components/StageModal';
import { DealModal } from './components/DealModal';
import { ProductManagerModal } from './components/ProductManagerModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { LostReasonModal } from './components/LostReasonModal';

export default function SalesKanban({ onViewChange }) {
    const { isDragging, dragScrollProps } = useDragScroll();
    const { products, createProduct, updateProduct, deleteProduct } = useCrmProducts();
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
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
        isStageModalOpen,
        setIsStageModalOpen,
        stageToEdit,
        setStageToEdit,
        deleteModal,
        setDeleteModal,
        lostReasonModal,
        setLostReasonModal,
        handleConfirmLostReason,
        handleMoveDeal,
        handleSyncHistory,
        handleSavePipeline,
        handleDeletePipeline,
        handleSaveDeal,
        handleDeleteDeal,
        handleSaveStage,
        handleDeleteStage,
        handleOpenChat,
        fetchBoard
    } = useSalesKanban({ onViewChange });

    const { activeClient } = useClient();
    const clientId = activeClient?.id;

    const {
        selectedDealIds,
        isBulkEditModalOpen,
        setIsBulkEditModalOpen,
        isProcessingBulk,
        toggleSelectDeal,
        selectAllDeals,
        toggleSelectStage,
        clearSelectedDeals,
        openBulkDeleteConfirm,
        handleBulkDeleteDeals,
        handleBulkUpdateDeals
    } = useBulkDeals({
        clientId,
        selectedPipelineId,
        onRefreshBoard: fetchBoard,
        setDeleteModal
    });

    const allVisibleDealIds = useMemo(() => {
        const ids = [];
        (filteredStages || []).forEach(st => {
            if (st.deals) {
                st.deals.forEach(d => ids.push(d.id));
            }
        });
        return ids;
    }, [filteredStages]);

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

    const openNewStage = () => {
        setStageToEdit(null);
        setIsStageModalOpen(true);
    };

    const openEditStage = (stage) => {
        setStageToEdit(stage);
        setIsStageModalOpen(true);
    };

    const confirmDeleteStage = (stageId, stageName) => {
        setIsStageModalOpen(false);
        setDeleteModal({
            isOpen: true,
            type: 'stage',
            id: stageId,
            title: 'Excluir Coluna?',
            message: `Tem certeza que deseja excluir a coluna "${stageName}"? Se houver oportunidades nela, serão movidas automaticamente para a etapa anterior.`
        });
    };

    const confirmDeletePipeline = (pipelineId, pipelineName) => {
        setIsPipelineModalOpen(false);
        setDeleteModal({
            isOpen: true,
            type: 'pipeline',
            id: pipelineId,
            title: 'Excluir Pipeline?',
            message: `Tem certeza que deseja excluir o pipeline "${pipelineName}"? Todas as colunas e oportunidades vinculadas a ele serão excluídas permanentemente.`
        });
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
        if (deleteModal.type === 'bulk_deals') {
            await handleBulkDeleteDeals();
        } else if (deleteModal.type === 'deal') {
            await handleDeleteDeal(deleteModal.id);
        } else if (deleteModal.type === 'pipeline') {
            await handleDeletePipeline(deleteModal.id);
        } else if (deleteModal.type === 'stage') {
            await handleDeleteStage(deleteModal.id);
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
        <div className="flex-1 p-2 sm:p-3 flex flex-col h-full min-h-0 overflow-hidden">
            {/* Header com Seletor, Ações e Métricas */}
            <KanbanHeader
                pipelines={pipelines}
                selectedPipelineId={selectedPipelineId}
                onSelectPipeline={setSelectedPipelineId}
                boardData={boardData}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onOpenNewPipeline={openNewPipeline}
                onOpenEditPipeline={openEditPipeline}
                onDeletePipeline={(pipe) => confirmDeletePipeline(pipe.id, pipe.name)}
                onOpenNewDeal={openNewDeal}
                onOpenNewStage={openNewStage}
                onOpenProducts={() => setIsProductModalOpen(true)}
                productsCount={products.length}
                onSyncHistory={handleSyncHistory}
                isSyncing={isSyncing}
            />

            {/* Barra de Ações em Massa */}
            <BulkActionsBar
                selectedCount={selectedDealIds.length}
                totalDeals={allVisibleDealIds.length}
                stages={filteredStages}
                onSelectAll={() => selectAllDeals(allVisibleDealIds)}
                onClearSelection={clearSelectedDeals}
                onSelectStage={toggleSelectStage}
                onOpenBulkEdit={() => setIsBulkEditModalOpen(true)}
                onOpenBulkDelete={openBulkDeleteConfirm}
            />

            {/* Quadro Kanban com Colunas Horizontais e Scroll por Arraste com Mouse */}
            <div
                {...dragScrollProps}
                data-testid="kanban-drag-scroll-container"
                className={`flex-1 overflow-x-auto overflow-y-hidden pb-1 custom-scrollbar transition-colors ${
                    isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
                }`}
            >
                <div className="flex items-stretch gap-3.5 min-w-max h-full">
                    {filteredStages.map(stage => (
                        <KanbanColumn
                            key={stage.id}
                            stage={stage}
                            onMoveDeal={handleMoveDeal}
                            onOpenNewDeal={openNewDeal}
                            onEditDeal={openEditDeal}
                            onDeleteDeal={confirmDeleteDeal}
                            onOpenChat={handleOpenChat}
                            onEditStage={openEditStage}
                            selectedDealIds={selectedDealIds}
                            onToggleSelectDeal={toggleSelectDeal}
                            onToggleSelectStage={toggleSelectStage}
                        />
                    ))}

                    {/* Botão Card para Criar Nova Coluna ao Final */}
                    <button
                        type="button"
                        onClick={openNewStage}
                        className="w-72 md:w-80 shrink-0 flex flex-col items-center justify-center h-full max-h-full min-h-0 bg-slate-950/20 hover:bg-blue-600/5 backdrop-blur-md rounded-2xl border-2 border-dashed border-white/10 hover:border-blue-500/40 transition-all duration-200 group cursor-pointer p-6 text-center"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-white/5 group-hover:bg-blue-500/10 text-slate-400 group-hover:text-blue-400 border border-white/10 group-hover:border-blue-500/30 flex items-center justify-center mb-3 transition-all">
                            <FiPlus size={22} />
                        </div>
                        <h4 className="text-sm font-black text-white group-hover:text-blue-300 transition-colors">
                            Nova Coluna
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                            Clique para adicionar uma nova etapa ao funil deste produto.
                        </p>
                    </button>

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
                onDelete={confirmDeletePipeline}
                pipelineToEdit={pipelineToEdit}
                products={products}
            />

            <StageModal
                isOpen={isStageModalOpen}
                onClose={() => setIsStageModalOpen(false)}
                onSave={handleSaveStage}
                onDelete={confirmDeleteStage}
                stageToEdit={stageToEdit}
                pipelineId={selectedPipelineId}
                pipelines={pipelines}
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
                products={products}
                onOpenChat={handleOpenChat}
            />

            <ProductManagerModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                products={products}
                onCreateProduct={createProduct}
                onUpdateProduct={updateProduct}
                onDeleteProduct={deleteProduct}
            />

            <BulkEditDealsModal
                isOpen={isBulkEditModalOpen}
                onClose={() => setIsBulkEditModalOpen(false)}
                onSave={handleBulkUpdateDeals}
                selectedCount={selectedDealIds.length}
                products={products}
            />

            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                title={deleteModal.title}
                message={deleteModal.message}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteModal({ isOpen: false, type: null, id: null, title: '', message: '' })}
                isProcessing={isProcessingBulk}
            />

            <LostReasonModal
                isOpen={lostReasonModal.isOpen}
                deal={lostReasonModal.deal}
                onClose={() => setLostReasonModal({ isOpen: false, deal: null, targetStageId: null })}
                onConfirm={handleConfirmLostReason}
            />
        </div>
    );
}
