import React, { useState, useEffect } from 'react';
import { ExternalOrderService } from '../../services/ExternalOrderService';
import { Search, Plus, Eye, ChevronLeft, ChevronRight, Settings, Filter } from 'lucide-react';
import { ExternalOrderDetailModal } from '../../components/Order/ExternalOrderDetailModal';


export const Bandeja = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Estados para filtros y paginación
    const [filters, setFilters] = useState({
        search: '',
        district: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });
    const [sorting, setSorting] = useState({
        field: 'created_at',
        order: 'desc'
    });

    // Control de columnas visibles
    const [visibleColumns, setVisibleColumns] = useState({
        customerName: true,
        phone: true,
        deliveryAddress: true,
        district: true,
        additionalDetails: true
    });
    const [showColumnSettings, setShowColumnSettings] = useState(false);

    useEffect(() => {
        loadOrders();
    }, [pagination.page, pagination.limit, sorting, filters]);

    const loadOrders = async () => {
        setIsLoading(true);
        try {
            const result = await ExternalOrderService.getExternalOrders(
                filters,
                { page: pagination.page, limit: pagination.limit },
                sorting
            );
            setOrders(result.orders);
            setPagination(prev => ({
                ...prev,
                total: result.total,
                totalPages: result.totalPages
            }));
        } catch (error) {
            console.error('Error loading external orders:', error);
            setOrders([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    };

    const handleSort = (field) => {
        setSorting(prev => ({
            field,
            order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleLimitChange = (e) => {
        setPagination(prev => ({
            ...prev,
            limit: parseInt(e.target.value),
            page: 1
        }));
    };

    const toggleColumn = (column) => {
        setVisibleColumns(prev => ({
            ...prev,
            [column]: !prev[column]
        }));
    };



    const handleOrderUpdated = (updatedOrder) => {
        setOrders(prev =>
            prev.map(order => order.id === updatedOrder.id ? updatedOrder : order)
        );
    };

    const getSortIcon = (field) => {
        if (sorting.field !== field) return '⇅';
        return sorting.order === 'asc' ? '↑' : '↓';
    };

    return (
        <div className="main-content">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 className="dashboard-title" style={{ margin: 0 }}>
                    Bandeja de Pedidos
                </h1>
            </header>

            {/* Filtros */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                    <div>
                        <label className="input-label">
                            <Search size={16} style={{ marginRight: '0.5rem' }} />
                            Buscar pedidos
                        </label>
                        <input
                            type="text"
                            name="search"
                            placeholder="Nombre, teléfono o # pedido..."
                            className="input-field"
                            value={filters.search}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div>
                        <label className="input-label">
                            <Filter size={16} style={{ marginRight: '0.5rem' }} />
                            Distrito
                        </label>
                        <input
                            type="text"
                            name="district"
                            placeholder="Filtrar por distrito..."
                            className="input-field"
                            value={filters.district}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <button
                        onClick={() => setFilters({ search: '', district: '' })}
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
                        onChange={handleLimitChange}
                        style={{ width: 'auto', padding: '0.5rem 1rem' }}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
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

            {/* Tabla de Datos */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                {/* Selector de columnas */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', position: 'relative' }}>
                    <button
                        onClick={() => setShowColumnSettings(!showColumnSettings)}
                        className="btn btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Settings size={18} />
                        <span className="hide-on-mobile">Columnas</span>
                    </button>

                    {showColumnSettings && (
                        <div className="glass-panel" style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '0.5rem',
                            padding: '1rem',
                            minWidth: '200px',
                            zIndex: 10,
                            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                        }}>
                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                Columnas visibles
                            </p>
                            {Object.entries(visibleColumns).map(([key, value]) => (
                                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={value}
                                        onChange={() => toggleColumn(key)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '0.9rem' }}>
                                        {key === 'customerName' ? 'Nombre Cliente' :
                                            key === 'phone' ? 'Teléfono' :
                                                key === 'deliveryAddress' ? 'Dirección' :
                                                    key === 'district' ? 'Distrito' :
                                                        'Detalles Adicionales'}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                {visibleColumns.customerName && (
                                    <th onClick={() => handleSort('customerName')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            Nombre Cliente {getSortIcon('customerName')}
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.phone && (
                                    <th onClick={() => handleSort('phone')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            Teléfono {getSortIcon('phone')}
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.deliveryAddress && (
                                    <th onClick={() => handleSort('deliveryAddress')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            Dirección {getSortIcon('deliveryAddress')}
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.district && (
                                    <th onClick={() => handleSort('district')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            Distrito {getSortIcon('district')}
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.additionalDetails && (
                                    <th>Detalles Adicionales</th>
                                )}
                                <th style={{ textAlign: 'center', width: '100px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    {visibleColumns.customerName && (
                                        <td style={{ fontWeight: '600' }}>{order.customerName}</td>
                                    )}
                                    {visibleColumns.phone && (
                                        <td>{order.phone}</td>
                                    )}
                                    {visibleColumns.deliveryAddress && (
                                        <td>{order.deliveryAddress || '-'}</td>
                                    )}
                                    {visibleColumns.district && (
                                        <td>{order.district || '-'}</td>
                                    )}
                                    {visibleColumns.additionalDetails && (
                                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {order.additionalDetails || '-'}
                                        </td>
                                    )}
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="btn-icon"
                                            style={{
                                                padding: '0.5rem',
                                                color: 'var(--primary-color)',
                                                background: 'var(--primary-light)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            title="Ver detalle"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {orders.length === 0 && !isLoading && (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            <p style={{ fontSize: '1.1rem' }}>No se encontraron pedidos</p>
                        </div>
                    )}
                </div>
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
            {selectedOrder && (
                <ExternalOrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onUpdate={handleOrderUpdated}
                />
            )}



            {/* Loading */}
            {isLoading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <div className="loading-text">Cargando Pedidos...</div>
                </div>
            )}
        </div>
    );
};
