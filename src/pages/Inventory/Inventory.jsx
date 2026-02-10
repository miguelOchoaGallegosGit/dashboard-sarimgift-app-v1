import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter } from 'lucide-react';
import { InventoryService } from '../../services/InventoryService';
import { InventoryGrid } from '../../components/Inventory/InventoryGrid';
import { AddInventoryItemModal } from '../../components/Inventory/AddInventoryItemModal';
import { UpdateStockModal } from '../../components/Inventory/UpdateStockModal';

export const Inventory = () => {
    const [items, setItems] = useState([]);
    const [filters, setFilters] = useState({ search: '', category: '' });
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [sorting, setSorting] = useState({ field: 'itemNumber', order: 'asc' });
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedItemForUpdate, setSelectedItemForUpdate] = useState(null);

    const categories = ['Unisex', 'Niño', 'Niña', 'Dama', 'Caballero', 'Accesorios'];

    useEffect(() => {
        loadInventory();
    }, [pagination.page, pagination.limit, sorting]);

    useEffect(() => {
        // Resetear a página 1 cuando cambian los filtros
        if (pagination.page !== 1) {
            setPagination(prev => ({ ...prev, page: 1 }));
        } else {
            loadInventory();
        }
    }, [filters]);

    const loadInventory = async () => {
        setIsLoading(true);
        try {
            const result = await InventoryService.getInventoryItems(filters, pagination, sorting);
            setItems(result.items);
            setPagination(prev => ({
                ...prev,
                total: result.total,
                totalPages: result.totalPages
            }));
        } catch (error) {
            console.error('Error loading inventory:', error);
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleClearFilters = () => {
        setFilters({ search: '', category: '' });
    };

    const handleLimitChange = (newLimit) => {
        setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleSortChange = (newSorting) => {
        setSorting(newSorting);
    };

    const handleSaveNewItem = async (itemData) => {
        try {
            await InventoryService.createInventoryItem(itemData);
            await loadInventory();
        } catch (error) {
            console.error('Error creating item:', error);
            throw error;
        }
    };

    const handleUpdateStock = async (itemId, updates) => {
        try {
            await InventoryService.updateInventoryItem(itemId, updates);
            await loadInventory();
        } catch (error) {
            console.error('Error updating item:', error);
            throw error;
        }
    };

    const lowStockCount = items.filter(item => item.quantity < 5).length;

    return (
        <div className="main-content">
            {/* Header */}
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="dashboard-title">
                        Inventario
                    </h1>
                    <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Gestiona el stock de tus productos
                    </p>
                </div>

                <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
                    <Plus size={18} />
                    <span>Agregar Item</span>
                </button>
            </header>

            {/* Stats */}
            <div className="glass-panel" style={{ padding: '0.6rem 2rem', display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Items</span>
                    <span style={{ fontWeight: '800', fontSize: '1.4rem' }}>{pagination.total}</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Stock Bajo</span>
                    <span style={{ fontWeight: '800', fontSize: '1.4rem', color: 'var(--danger-color)' }}>
                        {lowStockCount}
                    </span>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Mostrando</span>
                    <span style={{ fontWeight: '800', fontSize: '1.4rem', color: 'var(--primary-color)' }}>
                        {items.length}
                    </span>
                </div>
            </div>

            {/* Filtros */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div className="search-filter-grid">
                    <div className="filter-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                            <Search size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
                            Buscar Producto
                        </label>
                        <input
                            type="text"
                            name="search"
                            placeholder="Nombre del producto..."
                            className="input-field"
                            value={filters.search}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div className="filter-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                            <Filter size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
                            Categoría
                        </label>
                        <select
                            name="category"
                            className="input-field"
                            value={filters.category}
                            onChange={handleFilterChange}
                        >
                            <option value="">Todas las categorías</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleClearFilters}
                        className="btn btn-secondary"
                        style={{ height: '48px' }}
                    >
                        Limpiar Filtros
                    </button>
                </div>
            </div>

            {/* Paginación Superior */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Items por página:</span>
                    <select
                        className="input-field"
                        value={pagination.limit}
                        onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                        style={{ width: 'auto', padding: '0.5rem 1rem' }}
                    >
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>

                {pagination.totalPages > 1 && (
                    <div className="pagination-controls">
                        <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem 1rem' }}
                        >
                            Anterior
                        </button>
                        <span style={{ padding: '0 1rem', color: 'var(--text-muted)' }}>
                            Página {pagination.page} de {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages}
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem 1rem' }}
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>

            {/* Grilla de Inventario */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <InventoryGrid
                    items={items}
                    onUpdateStock={(item) => setSelectedItemForUpdate(item)}
                    sorting={sorting}
                    onSortChange={handleSortChange}
                />
            </div>

            {/* Paginación Inferior */}
            {pagination.totalPages > 1 && (
                <div className="pagination-controls" style={{ marginTop: '1.5rem', justifyContent: 'center' }}>
                    <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="btn btn-secondary"
                    >
                        Anterior
                    </button>
                    <span style={{ padding: '0 1rem', color: 'var(--text-muted)' }}>
                        Página {pagination.page} de {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="btn btn-secondary"
                    >
                        Siguiente
                    </button>
                </div>
            )}

            {/* Modales */}
            {showAddModal && (
                <AddInventoryItemModal
                    onClose={() => setShowAddModal(false)}
                    onSave={handleSaveNewItem}
                />
            )}

            {selectedItemForUpdate && (
                <UpdateStockModal
                    item={selectedItemForUpdate}
                    onClose={() => setSelectedItemForUpdate(null)}
                    onUpdate={handleUpdateStock}
                />
            )}

            {/* Loading Overlay */}
            {isLoading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <div className="loading-text">Cargando Inventario...</div>
                </div>
            )}
        </div>
    );
};
