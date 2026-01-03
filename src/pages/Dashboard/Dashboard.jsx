import React, { useState, useEffect } from 'react';
import { OrderService } from '../../services';
import { ShoppingBag, Calendar, User, ChevronRight } from 'lucide-react';
import { OrderDetailsModal } from '../../components/Order/OrderDetailsModal';

export const Dashboard = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            const data = await OrderService.getOrders();
            setOrders(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading orders:', error);
            setOrders([]);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const filteredOrders = orders.filter(order => {
        const matchSearch = (order.customerName || '').toLowerCase().includes(filters.search.toLowerCase()) ||
            (order.orderNumber || '').toLowerCase().includes(filters.search.toLowerCase());
        const matchStatus = filters.status === '' || order.status === filters.status;

        const orderDate = new Date(order.date).getTime();
        const matchStart = !filters.startDate || orderDate >= new Date(filters.startDate).getTime();
        const matchEnd = !filters.endDate || orderDate <= new Date(filters.endDate).getTime();

        return matchSearch && matchStatus && matchStart && matchEnd;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Cerrado': return 'var(--success-color)';
            case 'Entregado': return 'var(--primary-color)';
            case 'En Proceso': return 'var(--warning-color)';
            default: return 'var(--text-muted)';
        }
    };

    return (
        <div style={{ padding: '2rem 0' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ fontSize: '2.4rem', margin: 0, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '800' }}>
                    Dashboard
                </h1>

                <div className="glass-panel" style={{ padding: '0.6rem 2rem', display: 'flex', gap: '2rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total</span>
                        <span style={{ fontWeight: '800', fontSize: '1.4rem' }}>{filteredOrders.length}</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Pendientes</span>
                        <span style={{ fontWeight: '800', fontSize: '1.4rem', color: 'var(--warning-color)' }}>
                            {filteredOrders.filter(o => o.status !== 'Cerrado').length}
                        </span>
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
                            <option value="Entregado">Entregado</option>
                            <option value="Cerrado">Cerrado</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Fecha Desde</label>
                        <input
                            type="date"
                            name="startDate"
                            className="input-field"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div className="filter-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Fecha Hasta</label>
                        <input
                            type="date"
                            name="endDate"
                            className="input-field"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                        />
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
                                {order.status}
                            </span>
                        </div>

                        <div style={{ display: 'grid', gap: '1rem', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                                <Calendar size={16} />
                                <span>Entrega: <strong style={{ color: 'var(--text-color)' }}>{order.deliveryDate}</strong></span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    {order.items?.length || 0} items registrados
                                </div>
                                <div style={{ fontWeight: '800', fontSize: '1.3rem', color: 'var(--primary-color)' }}>
                                    S/ {order.totalAmount.toFixed(2)}
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
        </div>
    );
};
