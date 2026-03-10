import React, { useState, useEffect } from 'react';
import { OrderService } from '../../services';
import { ShoppingBag, Calendar, User, ChevronRight, Wallet, Plus } from 'lucide-react';
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
    };

    const filteredOrders = orders.filter(order => {
        const matchSearch = (order.customerName || '').toLowerCase().includes(filters.search.toLowerCase()) ||
            (order.orderNumber || '').toLowerCase().includes(filters.search.toLowerCase());

        // Lógica de filtrado por estado
        let matchStatus;
        if (filters.status === '') {
            matchStatus = true;
        } else if (filters.status === 'Entregado') {
            // "Entregado": estado Terminado, con entrega marcada, pero pendiente de pago
            matchStatus = order.status === 'Terminado' && order.isDelivered === true && order.isPaid === false;
        } else if (filters.status === 'Cerrado y Pagado') {
            // "Cerrado y Pagado": tiene ambos checks
            matchStatus = order.isDelivered === true && order.isPaid === true;
        } else if (filters.status === 'En Proceso') {
            // "En Proceso" puro: sin entrega ni pago marcado, y estado es En Proceso
            matchStatus = order.status === 'En Proceso' && !order.isDelivered && !order.isPaid;
        } else if (filters.status === 'Terminado') {
            // "Terminado": estado Terminado, sin marca de entregado ni pagado
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

    const handleNewOrderCreated = (newOrder) => {
        setOrders(prev => [newOrder, ...prev]);
    };

    return (
        <div className="main-content">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 className="dashboard-title">
                    Tablero de pedidos
                </h1>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setIsNewOrderModalOpen(true)}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={20} />
                        Nuevo Pedido
                    </button>

                    <div className="glass-panel" style={{ padding: '0.6rem 2rem', display: 'flex', gap: '2rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total</span>
                            <span style={{ fontWeight: '800', fontSize: '1.4rem' }}>{filteredOrders.length}</span>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Pendientes</span>
                            <span style={{ fontWeight: '800', fontSize: '1.4rem', color: 'var(--warning-color)' }}>
                                {filteredOrders.filter(o => o.status !== 'Cerrado' && o.status !== 'Cerrado y Pagado').length}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* FILTROS CON CLASE CSS ROBUSTA */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div className="search-filter-grid">
                    <div className="filter-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Buscar Pedido</label>
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
                        <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Estado Actual</label>
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
                        <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Rango de Fechas</label>
                        <div className="date-range-group">
                            <input
                                type="date"
                                name="startDate"
                                className="input-field"
                                placeholder="Desde"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                            />
                            <input
                                type="date"
                                name="endDate"
                                className="input-field"
                                placeholder="Hasta"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                            />
                        </div>
                    </div>

                    <button
                        onClick={() => setFilters({ search: '', status: '', startDate: '', endDate: '' })}
                        className="btn btn-secondary"
                        style={{ height: '48px', width: '100%' }}
                    >
                        Limpiar Filtros
                    </button>
                </div>
            </div>

            {isFiltered && filteredOrders.length > 0 && (
                <div className="disclaimer-banner">
                    <div className="disclaimer-content">
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary-color)' }}>
                            <Wallet size={24} />
                        </div>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
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

            <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {filteredOrders.map(order => (
                    <div
                        key={order.id}
                        className="glass-panel order-card ripple"
                        onClick={() => setSelectedOrder(order)}
                        style={{ cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', padding: '1.5rem' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>
                                    {order.orderNumber}
                                </span>
                                <h3 style={{ margin: '6px 0', fontSize: '1.2rem', fontWeight: '700' }}>{order.customerName}</h3>
                            </div>
                            <span style={{
                                padding: '6px 12px',
                                borderRadius: '30px',
                                fontSize: '0.7rem',
                                fontWeight: '800',
                                textTransform: 'uppercase',
                                backgroundColor: `${getStatusColor(order.status)}15`,
                                color: getStatusColor(order.status),
                                border: `1px solid ${getStatusColor(order.status)}30`
                            }}>
                                {(order.status === 'Cerrado' || order.status === 'Cerrado y Pagado') ? 'Cerrado y Pagado' : order.status}
                            </span>
                        </div>

                        <div style={{ display: 'grid', gap: '1rem', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                                <Calendar size={16} />
                                <span>Entrega: <strong style={{ color: 'var(--text-color)' }}>
                                    {(() => {
                                        if (!order.deliveryDate) return 'No especificada';
                                        try {
                                            const date = new Date(order.deliveryDate);
                                            // Usar split para evitar problemas con zonas horarias si solo es fecha YYYY-MM-DD
                                            if (order.deliveryDate.includes('T')) {
                                                return isNaN(date.getTime()) ? order.deliveryDate : date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                            }
                                            const [year, month, day] = order.deliveryDate.split('-');
                                            return `${day}/${month}/${year}`;
                                        } catch (e) {
                                            return order.deliveryDate;
                                        }
                                    })()}
                                </strong></span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    {order.items?.length || 0} items registrados
                                </div>
                                <div style={{ fontWeight: '800', fontSize: '1.3rem', color: order.totalBalance > 0 ? 'var(--primary-color)' : 'var(--success-color)' }}>
                                    S/ {(order.totalBalance || 0).toFixed(2)}
                                </div>
                            </div>
                        </div>

                        <div className="card-footer" style={{
                            marginTop: '1.2rem',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            color: 'var(--primary-color)',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            gap: '4px',
                            alignItems: 'center'
                        }}>
                            Gestionar pedido <ChevronRight size={18} />
                        </div>
                    </div>
                ))}
            </div>

            {filteredOrders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '6rem', color: 'var(--text-muted)' }}>
                    <ShoppingBag size={64} style={{ marginBottom: '1.5rem', opacity: 0.1 }} />
                    <p style={{ fontSize: '1.1rem' }}>No hay pedidos que coincidan con tu búsqueda.</p>
                </div>
            )}

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
