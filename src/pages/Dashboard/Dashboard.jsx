import React, { useState, useEffect } from 'react';
import { OrderService } from '../../services';
import { ShoppingBag, Calendar, Wallet, Plus, Eye, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { OrderDetailsModal } from '../../components/Order/OrderDetailsModal';
import { NewOrderModal } from '../../components/Order/NewOrderModal';

export const Dashboard = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        startDate: '',
        endDate: ''
    });
    const [isLoading, setIsLoading] = useState(true);

    // Pagination (client-side)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10
    });

    // Sorting
    const [sorting, setSorting] = useState({
        field: 'orderNumber',
        order: 'desc'
    });

    // Column visibility
    const [visibleColumns, setVisibleColumns] = useState({
        orderNumber: true,
        customerName: true,
        deliveryDate: true,
        status: true,
        itemsCount: true,
        totalBalance: true
    });
    const [showColumnSettings, setShowColumnSettings] = useState(false);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setIsLoading(true);
        try {
            const data = await OrderService.getOrders();
            setOrders(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading orders:', error);
            setOrders([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const clearFilters = () => {
        setFilters({ search: '', status: '', startDate: '', endDate: '' });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // Filter logic
    const filteredOrders = orders.filter(order => {
        const matchSearch = (order.customerName || '').toLowerCase().includes(filters.search.toLowerCase()) ||
            (order.orderNumber || '').toLowerCase().includes(filters.search.toLowerCase());

        let matchStatus;
        if (filters.status === '') {
            matchStatus = true;
        } else if (filters.status === 'Entregado') {
            matchStatus = order.status === 'Terminado' && order.isDelivered === true && order.isPaid === false;
        } else if (filters.status === 'Cerrado y Pagado') {
            matchStatus = order.isDelivered === true && order.isPaid === true;
        } else if (filters.status === 'En Proceso') {
            matchStatus = order.status === 'En Proceso' && !order.isDelivered && !order.isPaid;
        } else if (filters.status === 'Terminado') {
            matchStatus = order.status === 'Terminado' && !order.isDelivered && !order.isPaid;
        } else if (filters.status === 'Recibido') {
            matchStatus = order.status === 'Recibido' && !order.isDelivered && !order.isPaid;
        } else {
            const orderStatus = (order.status || '').toLowerCase();
            const filterStatus = filters.status.toLowerCase();
            matchStatus = orderStatus === filterStatus;
        }

        const orderDate = new Date(order.date).getTime();
        const matchStart = !filters.startDate || orderDate >= new Date(filters.startDate).getTime();
        const matchEnd = !filters.endDate || orderDate <= new Date(filters.endDate).getTime();

        return matchSearch && matchStatus && matchStart && matchEnd;
    });

    // Sorting
    const sortedOrders = [...filteredOrders].sort((a, b) => {
        const field = sorting.field;
        let aVal = a[field];
        let bVal = b[field];

        if (field === 'itemsCount') {
            aVal = a.items?.length || 0;
            bVal = b.items?.length || 0;
        }
        if (field === 'deliveryDate') {
            aVal = aVal ? new Date(aVal).getTime() : 0;
            bVal = bVal ? new Date(bVal).getTime() : 0;
        }
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = (bVal || '').toLowerCase();
        }

        if (aVal < bVal) return sorting.order === 'asc' ? -1 : 1;
        if (aVal > bVal) return sorting.order === 'asc' ? 1 : -1;
        return 0;
    });

    // Pagination
    const totalPages = Math.ceil(sortedOrders.length / pagination.limit);
    const paginatedOrders = sortedOrders.slice(
        (pagination.page - 1) * pagination.limit,
        pagination.page * pagination.limit
    );

    const totalAmountFiltered = filteredOrders.reduce((sum, order) => sum + (order.totalBalance || 0), 0);
    const isFiltered = filters.search !== '' || filters.status !== '' || filters.startDate !== '' || filters.endDate !== '';

    const getStatusColor = (status) => {
        if (status === 'Cerrado' || status === 'Cerrado y Pagado') return 'var(--success-color)';
        switch (status) {
            case 'Entregado': return 'var(--primary-color)';
            case 'Terminado': return 'var(--info-color)';
            case 'En Proceso': return 'var(--warning-color)';
            default: return 'var(--text-muted)';
        }
    };

    const getDisplayStatus = (order) => {
        if (order.isDelivered && order.isPaid) return 'Cerrado y Pagado';
        if (order.status === 'Terminado' && order.isDelivered) return 'Entregado';
        return order.status;
    };

    const handleSort = (field) => {
        setSorting(prev => ({
            field,
            order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIcon = (field) => {
        if (sorting.field !== field) return '⇅';
        return sorting.order === 'asc' ? '↑' : '↓';
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleLimitChange = (e) => {
        setPagination({ limit: parseInt(e.target.value), page: 1 });
    };

    const toggleColumn = (column) => {
        setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
    };

    const handleNewOrderCreated = (newOrder) => {
        setOrders(prev => [newOrder, ...prev]);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            if (dateString.includes('T')) {
                const date = new Date(dateString);
                return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
            }
            const [year, month, day] = dateString.split('-');
            return `${day}/${month}/${year}`;
        } catch (e) {
            return dateString;
        }
    };

    const columnLabels = {
        orderNumber: '# Pedido',
        customerName: 'Cliente',
        deliveryDate: 'F. Entrega',
        status: 'Estado',
        itemsCount: 'Items',
        totalBalance: 'Saldo'
    };

    return (
        <div className="main-content">
            {/* Header */}
            <header className="page-header">
                <div className="page-header-left">
                    <div className="glass-panel stats-inline">
                        <div className="stat-item">
                            <span className="stat-item-label">Total</span>
                            <span className="stat-item-value">{filteredOrders.length}</span>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat-item">
                            <span className="stat-item-label">Pendientes</span>
                            <span className="stat-item-value" style={{ color: 'var(--warning-color)' }}>
                                {filteredOrders.filter(o => o.status !== 'Cerrado' && o.status !== 'Cerrado y Pagado').length}
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setIsNewOrderModalOpen(true)}
                    className="btn btn-primary"
                >
                    <Plus size={18} />
                    <span>Nuevo Pedido</span>
                </button>
            </header>

            {/* Filtros */}
            <div className="glass-panel filter-panel">
                <div className="search-filter-grid">
                    <div className="filter-group">
                        <label>Buscar Pedido</label>
                        <input
                            type="text"
                            name="search"
                            placeholder="Nombre o # Pedido..."
                            className="input-field"
                            value={filters.search}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div className="filter-group">
                        <label>Estado Actual</label>
                        <select
                            name="status"
                            className="input-field"
                            value={filters.status}
                            onChange={handleFilterChange}
                        >
                            <option value="">Todos los estados</option>
                            <option value="Recibido">Recibido</option>
                            <option value="En Proceso">En Proceso</option>
                            <option value="Terminado">Terminado</option>
                            <option value="Entregado">Entregado</option>
                            <option value="Cerrado y Pagado">Cerrado y Pagado</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Rango de Fechas</label>
                        <div className="date-range-group">
                            <input
                                type="date"
                                name="startDate"
                                className="input-field"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                            />
                            <input
                                type="date"
                                name="endDate"
                                className="input-field"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                            />
                        </div>
                    </div>

                    <button onClick={clearFilters} className="btn btn-secondary" style={{ height: '42px', width: '100%' }}>
                        Limpiar
                    </button>
                </div>
            </div>

            {/* Banner de acumulado */}
            {isFiltered && filteredOrders.length > 0 && (
                <div className="disclaimer-banner">
                    <div className="disclaimer-content">
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary-color)' }}>
                            <Wallet size={24} />
                        </div>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Saldo Pendiente Acumulado (Filtro)
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Suma de los <strong style={{ color: 'var(--text-primary)' }}>{filteredOrders.length}</strong> pedidos encontrados
                            </p>
                        </div>
                    </div>
                    <div className="total-amount-badge">
                        <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '400', marginRight: '8px' }}>S/</span>
                        {totalAmountFiltered.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
            )}

            {/* Pagination controls top */}
            <div className="pagination-bar">
                <div className="pagination-bar-left">
                    <span className="pagination-info">Items por página:</span>
                    <select
                        className="input-field pagination-select"
                        value={pagination.limit}
                        onChange={handleLimitChange}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>

                {totalPages > 1 && (
                    <div className="pagination-controls">
                        <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="btn btn-secondary btn-sm"
                        >
                            Anterior
                        </button>
                        <span className="pagination-info">
                            Página {pagination.page} de {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === totalPages}
                            className="btn btn-secondary btn-sm"
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>

            {/* Data Table - Desktop */}
            <div className="glass-panel data-panel">
                {/* Column selector */}
                <div className="table-toolbar">
                    <span className="table-toolbar-info">
                        {filteredOrders.length} registro{filteredOrders.length !== 1 ? 's' : ''}
                    </span>
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowColumnSettings(!showColumnSettings)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Settings size={16} />
                            <span className="hide-on-mobile">Columnas</span>
                        </button>

                        {showColumnSettings && (
                            <div className="column-dropdown glass-panel">
                                <p className="column-dropdown-title">Columnas visibles</p>
                                {Object.entries(visibleColumns).map(([key, value]) => (
                                    <label key={key} className="column-toggle-label">
                                        <input
                                            type="checkbox"
                                            checked={value}
                                            onChange={() => toggleColumn(key)}
                                            style={{ accentColor: 'var(--primary-color)' }}
                                        />
                                        <span>{columnLabels[key]}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="dashboard-table-container">
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    {visibleColumns.orderNumber && (
                                        <th onClick={() => handleSort('orderNumber')} style={{ cursor: 'pointer' }}>
                                            <div className="th-content"># Pedido {getSortIcon('orderNumber')}</div>
                                        </th>
                                    )}
                                    {visibleColumns.customerName && (
                                        <th onClick={() => handleSort('customerName')} style={{ cursor: 'pointer' }}>
                                            <div className="th-content">Cliente {getSortIcon('customerName')}</div>
                                        </th>
                                    )}
                                    {visibleColumns.deliveryDate && (
                                        <th onClick={() => handleSort('deliveryDate')} style={{ cursor: 'pointer' }}>
                                            <div className="th-content">F. Entrega {getSortIcon('deliveryDate')}</div>
                                        </th>
                                    )}
                                    {visibleColumns.status && (
                                        <th>Estado</th>
                                    )}
                                    {visibleColumns.itemsCount && (
                                        <th onClick={() => handleSort('itemsCount')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                            <div className="th-content" style={{ justifyContent: 'center' }}>Items {getSortIcon('itemsCount')}</div>
                                        </th>
                                    )}
                                    {visibleColumns.totalBalance && (
                                        <th onClick={() => handleSort('totalBalance')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                                            <div className="th-content" style={{ justifyContent: 'flex-end' }}>Saldo {getSortIcon('totalBalance')}</div>
                                        </th>
                                    )}
                                    <th style={{ textAlign: 'center', width: '80px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedOrders.map(order => {
                                    const displayStatus = getDisplayStatus(order);
                                    const statusColor = getStatusColor(displayStatus);
                                    return (
                                        <tr key={order.id} className="data-table-row-clickable" onClick={() => setSelectedOrder(order)}>
                                            {visibleColumns.orderNumber && (
                                                <td>
                                                    <span className="order-number-cell">{order.orderNumber}</span>
                                                </td>
                                            )}
                                            {visibleColumns.customerName && (
                                                <td style={{ fontWeight: '600' }}>{order.customerName}</td>
                                            )}
                                            {visibleColumns.deliveryDate && (
                                                <td>{formatDate(order.deliveryDate)}</td>
                                            )}
                                            {visibleColumns.status && (
                                                <td>
                                                    <span className="status-pill" style={{
                                                        backgroundColor: `${statusColor}15`,
                                                        color: statusColor,
                                                        border: `1px solid ${statusColor}30`
                                                    }}>
                                                        {displayStatus}
                                                    </span>
                                                </td>
                                            )}
                                            {visibleColumns.itemsCount && (
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className="items-count-badge">{order.items?.length || 0}</span>
                                                </td>
                                            )}
                                            {visibleColumns.totalBalance && (
                                                <td style={{ textAlign: 'right', fontWeight: '700', color: order.totalBalance > 0 ? 'var(--primary-color)' : 'var(--success-color)' }}>
                                                    S/ {(order.totalBalance || 0).toFixed(2)}
                                                </td>
                                            )}
                                            <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="btn-icon"
                                                    title="Ver detalle"
                                                    style={{ color: 'var(--primary-color)' }}
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Cards */}
                <div className="dashboard-cards-container">
                    {paginatedOrders.map(order => {
                        const displayStatus = getDisplayStatus(order);
                        const statusColor = getStatusColor(displayStatus);
                        return (
                            <div key={order.id} className="dashboard-card" onClick={() => setSelectedOrder(order)}>
                                <div className="dashboard-card-header">
                                    <div>
                                        <span className="dashboard-card-number">{order.orderNumber}</span>
                                        <h3 className="dashboard-card-name">{order.customerName}</h3>
                                    </div>
                                    <span className="status-pill" style={{
                                        backgroundColor: `${statusColor}15`,
                                        color: statusColor,
                                        border: `1px solid ${statusColor}30`
                                    }}>
                                        {displayStatus}
                                    </span>
                                </div>
                                <div className="dashboard-card-body">
                                    <div>
                                        <span className="dashboard-card-label">Entrega</span>
                                        <span>{formatDate(order.deliveryDate)}</span>
                                    </div>
                                    <div>
                                        <span className="dashboard-card-label">Items</span>
                                        <span>{order.items?.length || 0}</span>
                                    </div>
                                    <div>
                                        <span className="dashboard-card-label">Saldo</span>
                                        <span style={{ fontWeight: '700', color: order.totalBalance > 0 ? 'var(--primary-color)' : 'var(--success-color)' }}>
                                            S/ {(order.totalBalance || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredOrders.length === 0 && !isLoading && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                        <ShoppingBag size={48} style={{ marginBottom: '1rem', opacity: 0.15 }} />
                        <p>No hay pedidos que coincidan con tu búsqueda.</p>
                    </div>
                )}
            </div>

            {/* Pagination bottom */}
            {totalPages > 1 && (
                <div className="pagination-controls" style={{ marginTop: '1.5rem', justifyContent: 'center' }}>
                    <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="btn btn-secondary btn-sm">
                        Anterior
                    </button>
                    <span className="pagination-info">Página {pagination.page} de {totalPages}</span>
                    <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === totalPages} className="btn btn-secondary btn-sm">
                        Siguiente
                    </button>
                </div>
            )}

            {/* Modals */}
            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onUpdate={(updated) => {
                        setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
                    }}
                />
            )}

            <NewOrderModal
                isOpen={isNewOrderModalOpen}
                onClose={() => setIsNewOrderModalOpen(false)}
                onOrderCreated={handleNewOrderCreated}
            />

            {isLoading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <div className="loading-text">Cargando Pedidos...</div>
                </div>
            )}
        </div>
    );
};
