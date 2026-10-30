import { resolveUrl } from '../../../config';
import { getWindow24hStatus } from './kanbanCardUtils';

export function filterKanbanStages(
    boardData,
    searchTerm,
    filterWindowOpenOnly = false,
    filterUnreadOnly = false,
    currentTime = null,
    filterProduct = 'all',
    products = []
) {
    if (!boardData?.stages) return [];

    const hasSearch = Boolean(searchTerm && searchTerm.trim());
    const term = hasSearch ? searchTerm.toLowerCase().trim() : '';
    const hasProductFilter = Boolean(filterProduct && filterProduct !== 'all');

    if (!hasSearch && !filterWindowOpenOnly && !filterUnreadOnly && !hasProductFilter) {
        return boardData.stages;
    }

    return boardData.stages.map(stage => {
        const filteredDeals = (stage.deals || []).filter(deal => {
            if (filterWindowOpenOnly && !getWindow24hStatus(deal, currentTime).isOpen) {
                return false;
            }
            if (filterUnreadOnly && Number(deal.unread_count || 0) <= 0) {
                return false;
            }
            if (hasProductFilter) {
                const hasProd = Boolean(deal.product_id || (deal.product_name && deal.product_name.trim()));
                if (filterProduct === 'with_product' && !hasProd) {
                    return false;
                }
                if (filterProduct === 'without_product' && hasProd) {
                    return false;
                }
                if (filterProduct.startsWith('prod_')) {
                    const targetId = Number(filterProduct.replace('prod_', ''));
                    const targetProd = (products || []).find(p => p.id === targetId);
                    const matchesId = Number(deal.product_id) === targetId;
                    const matchesName = targetProd && deal.product_name && deal.product_name.toLowerCase().trim() === targetProd.name.toLowerCase().trim();
                    if (!matchesId && !matchesName) {
                        return false;
                    }
                }
            }
            if (hasSearch) {
                const name = (deal.contact_name || '').toLowerCase();
                const phone = (deal.contact_phone || '').toLowerCase();
                const title = (deal.title || '').toLowerCase();
                const email = (deal.contact_email || '').toLowerCase();
                const channelStr = (deal.channel || '').toLowerCase();
                return (
                    name.includes(term) ||
                    phone.includes(term) ||
                    title.includes(term) ||
                    email.includes(term) ||
                    channelStr.includes(term)
                );
            }
            return true;
        });

        const windowOpenDeals = filteredDeals.filter(d => getWindow24hStatus(d, currentTime).isOpen).length;
        const windowOpenPct = filteredDeals.length > 0
            ? Math.round((windowOpenDeals / filteredDeals.length) * 1000) / 10
            : 0;

        return {
            ...stage,
            deals: filteredDeals,
            total_deals: filteredDeals.length,
            total_value: filteredDeals.reduce((acc, cur) => acc + (cur.value || 0), 0),
            window_open_deals: windowOpenDeals,
            window_open_percentage: windowOpenPct
        };
    });
}

export function computeBoardWindowAndUnreadStats(boardData, currentTime = null) {
    if (!boardData?.stages) {
        return {
            totalDeals: 0,
            windowOpenCount: 0,
            windowOpenPercentage: 0,
            unreadDealsCount: 0,
            countWithProduct: 0,
            countWithoutProduct: 0
        };
    }

    let totalDeals = 0;
    let windowOpenCount = 0;
    let unreadDealsCount = 0;
    let countWithProduct = 0;
    let countWithoutProduct = 0;

    boardData.stages.forEach(stg => {
        (stg.deals || []).forEach(deal => {
            totalDeals += 1;
            if (getWindow24hStatus(deal, currentTime).isOpen) {
                windowOpenCount += 1;
            }
            if (Number(deal.unread_count || 0) > 0) {
                unreadDealsCount += 1;
            }
            if (Boolean(deal.product_id || (deal.product_name && deal.product_name.trim()))) {
                countWithProduct += 1;
            } else {
                countWithoutProduct += 1;
            }
        });
    });

    const windowOpenPercentage = totalDeals > 0
        ? Math.round((windowOpenCount / totalDeals) * 1000) / 10
        : 0;

    return {
        totalDeals,
        windowOpenCount,
        windowOpenPercentage,
        unreadDealsCount,
        countWithProduct,
        countWithoutProduct
    };
}

export async function apiRequestJson(path, method, headers, body = undefined, fallbackError = 'Falha na requisição') {
    const res = await fetch(resolveUrl(path), {
        method,
        headers,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    });
    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || fallbackError);
    }
    return res.json();
}
