import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export function useViewContactsModal({ viewingContacts, onSaveExclusions, onRefreshContacts }) {
    const [localExclusions, setLocalExclusions] = useState([]);
    const [filterType, setFilterType] = useState('all'); // 'all' | 'active' | 'excluded'
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Filtros de Público Alvo Dinâmicos (Interação e Data de Criação)
    const [interactionFilter, setInteractionFilter] = useState(null); // null | 7 | 14 | 30 | 60 | 90
    const [createdFilter, setCreatedFilter] = useState(null); // null | 7 | 14 | 30 | 60 | 90

    // Estados de Paginação
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);

    useEffect(() => {
        if (viewingContacts) {
            setLocalExclusions(viewingContacts.exclusion_list || []);
            setInteractionFilter(viewingContacts.interaction_filter_days || null);
            setCreatedFilter(viewingContacts.created_filter_days || null);
            setFilterType('all');
            setCurrentPage(0);
        }
    }, [viewingContacts]);

    // Resetar página quando filtrar ou alterar limite
    useEffect(() => {
        setCurrentPage(0);
    }, [filterType, pageSize, interactionFilter, createdFilter]);

    const contacts = viewingContacts?.contacts || [];

    const isContactMatchingFilters = (contact) => {
        const now = new Date();

        if (interactionFilter) {
            if (!contact.last_interaction_at) return false;
            const interactionDate = new Date(contact.last_interaction_at);
            const diffDays = (now - interactionDate) / (1000 * 60 * 60 * 24);
            if (diffDays > interactionFilter) return false;
        }

        if (createdFilter) {
            if (!contact.created_at) return false;
            const createdDate = new Date(contact.created_at);
            const diffDays = (now - createdDate) / (1000 * 60 * 60 * 24);
            if (diffDays > createdFilter) return false;
        }

        return true;
    };

    const handleToggleExclusion = (phone) => {
        setLocalExclusions(prev => {
            if (prev.includes(phone)) {
                return prev.filter(p => p !== phone);
            } else {
                return [...prev, phone];
            }
        });
    };

    const hasChanges = viewingContacts
        ? JSON.stringify([...localExclusions].sort()) !== JSON.stringify([...(viewingContacts.exclusion_list || [])].sort())
          || (interactionFilter || null) !== (viewingContacts.interaction_filter_days || null)
          || (createdFilter || null) !== (viewingContacts.created_filter_days || null)
        : false;

    // Contatos ativos são os que não estão excluídos manualmente E atendem aos filtros de período
    const activeContacts = contacts.filter(c => !localExclusions.includes(c.phone) && isContactMatchingFilters(c));
    const excludedContacts = contacts.filter(c => localExclusions.includes(c.phone) || !isContactMatchingFilters(c));

    const enrichedContacts = contacts.map(c => ({
        ...c,
        matchesAudience: isContactMatchingFilters(c)
    }));

    const filteredContacts = enrichedContacts.filter(c => {
        const isExcluded = localExclusions.includes(c.phone);
        const matchesAudience = c.matchesAudience;

        if (filterType === 'active') return !isExcluded && matchesAudience;
        if (filterType === 'excluded') return isExcluded || !matchesAudience;
        return true;
    });

    // Fatiar contatos para a página atual
    const totalFiltered = filteredContacts.length;
    const totalPages = Math.ceil(totalFiltered / pageSize);
    const displayedContacts = filteredContacts.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

    const handleSave = async () => {
        if (onSaveExclusions && viewingContacts) {
            await onSaveExclusions(viewingContacts.id, {
                exclusion_list: localExclusions,
                interaction_filter_days: interactionFilter ? Number(interactionFilter) : null,
                created_filter_days: createdFilter ? Number(createdFilter) : null
            });
        }
    };

    const handleRefresh = async () => {
        if (onRefreshContacts && viewingContacts) {
            setIsRefreshing(true);
            try {
                await onRefreshContacts(viewingContacts.id);
                toast.success("Contatos atualizados com sucesso!");
            } catch (err) {
                toast.error("Erro ao atualizar contatos.");
            } finally {
                setIsRefreshing(false);
            }
        }
    };

    return {
        localExclusions,
        filterType,
        setFilterType,
        isRefreshing,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        contacts,
        activeContacts,
        excludedContacts,
        totalFiltered,
        totalPages,
        displayedContacts,
        hasChanges,
        interactionFilter,
        setInteractionFilter,
        createdFilter,
        setCreatedFilter,
        handleToggleExclusion,
        handleSave,
        handleRefresh
    };
}
