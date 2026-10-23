import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { resolveUrl } from '../../../config';
import { useClient } from '../../../contexts/ClientContext';

export function useCrmProducts() {
    const { activeClient } = useClient();
    const clientId = activeClient?.id;

    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            'X-Client-ID': clientId ? String(clientId) : '1'
        };
    }, [clientId]);

    const fetchProducts = useCallback(async () => {
        if (!clientId) return;
        setIsLoading(true);
        try {
            const res = await fetch(resolveUrl('/api/crm/products'), {
                headers: getAuthHeaders()
            });
            if (!res.ok) {
                throw new Error('Falha ao carregar produtos');
            }
            const data = await res.json();
            setProducts(data || []);
        } catch (err) {
            console.error('Erro ao buscar produtos do CRM:', err);
        } finally {
            setIsLoading(false);
        }
    }, [clientId, getAuthHeaders]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const createProduct = async (productData) => {
        try {
            const res = await fetch(resolveUrl('/api/crm/products'), {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(productData)
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || 'Erro ao cadastrar produto.');
            }
            const created = await res.json();
            setProducts(prev => [...prev, created]);
            toast.success(`Produto "${created.name}" cadastrado com sucesso!`);
            return created;
        } catch (err) {
            toast.error(err.message || 'Erro ao cadastrar produto.');
            throw err;
        }
    };

    const updateProduct = async (productId, productData) => {
        try {
            const res = await fetch(resolveUrl(`/api/crm/products/${productId}`), {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(productData)
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || 'Erro ao atualizar produto.');
            }
            const updated = await res.json();
            setProducts(prev => prev.map(p => p.id === productId ? updated : p));
            toast.success(`Produto "${updated.name}" atualizado!`);
            return updated;
        } catch (err) {
            toast.error(err.message || 'Erro ao atualizar produto.');
            throw err;
        }
    };

    const deleteProduct = async (productId) => {
        try {
            const res = await fetch(resolveUrl(`/api/crm/products/${productId}`), {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || 'Erro ao excluir produto.');
            }
            setProducts(prev => prev.filter(p => p.id !== productId));
            toast.success('Produto excluído com sucesso.');
        } catch (err) {
            toast.error(err.message || 'Erro ao excluir produto.');
            throw err;
        }
    };

    return {
        products,
        isLoading,
        fetchProducts,
        createProduct,
        updateProduct,
        deleteProduct
    };
}
