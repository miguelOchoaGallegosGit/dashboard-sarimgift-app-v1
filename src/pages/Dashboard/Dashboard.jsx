import React, { useState, useEffect } from 'react';
import { OrderService } from '../../services/OrderService';
import { ShoppingBag, Calendar, User, ChevronRight } from 'lucide-react';
import { OrderDetailsModal } from '../../components/Order/OrderDetailsModal';

export const Dashboard = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = () => {
        setOrders(OrderService.getOrders());
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Cerrado': return 'var(--success-color)';
            case 'Entregado': return 'var(--primary-color)';
            case 'En Proceso': return 'var(--warning-color)';
            default: return 'var(--text-muted)'; // Recibido
        }
    };

    return (
        <div style={{ padding: '2rem 0' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '2rem', margin: 0, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Dashboard de Pedidos
                </h1>
                <div className="glass-panel" style={{ padding: '0.5rem 1.5rem', display: 'flex', gap: '2rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Pedidos</span>
                        <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{orders.length}</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pendientes</span>
                        <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--warning-color)' }}>
                            {orders.filter(o => o.status !== 'Cerrado').length}
                        </span>
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
                {orders.map(order => (
                    <div
                        key={order.id}
                        className="glass-panel"
                        style={{
                            padding: '1.5rem',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            borderLeft: `4px solid ${getStatusColor(order.status)}`
                        }}
                        onClick={() => setSelectedOrder(order)}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{order.orderNumber}</span>
                            <span style={{
                                fontSize: '0.8rem',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '12px',
                                background: `${getStatusColor(order.status)}20`,
                                color: getStatusColor(order.status),
                                border: `1px solid ${getStatusColor(order.status)}40`
                            }}>
                                {order.status}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <User size={14} /> {order.customerName}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Calendar size={14} /> {order.date}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ShoppingBag size={14} /> {order.items.length} Items - Entregar el {order.deliveryDate}
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Saldo Pendiente</span>
                                <div style={{ fontWeight: 'bold', color: order.totalBalance > 0 ? 'var(--primary-color)' : 'var(--success-color)' }}>
                                    S/ {order.totalBalance.toFixed(2)}
                                </div>
                            </div>
                            <ChevronRight size={20} color="var(--text-muted)" />
                        </div>
                    </div>
                ))}
            </div>

            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onUpdate={(updated) => {
                        // Refresh list locally
                        setOrders(orders.map(o => o.id === updated.id ? updated : o));
                        setSelectedOrder(updated);
                    }}
                />
            )}
        </div>
    );
};
