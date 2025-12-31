import React, { useEffect, useState } from 'react';
import { X, CheckCircle, Truck, CreditCard, Play } from 'lucide-react';
import { OrderService } from '../../services/OrderService';

export const OrderDetailsModal = ({ order, onClose, onUpdate }) => {
    const [currentOrder, setCurrentOrder] = useState(order);

    useEffect(() => {
        setCurrentOrder(order);
    }, [order]);

    if (!currentOrder) return null;

    const handleStatusChange = (key, value) => {
        // If we are starting the process
        if (key === 'status' && value === 'En Proceso') {
            const updated = OrderService.updateOrder(currentOrder.id, { status: 'En Proceso' });
            setCurrentOrder(updated);
            onUpdate(updated);
            return;
        }

        // If we are toggling flags
        const updates = { [key]: value };
        const updated = OrderService.updateOrder(currentOrder.id, updates);
        setCurrentOrder(updated);
        onUpdate(updated);
    };

    const isClosed = currentOrder.status === 'Cerrado';

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={onClose}>
            <div className="glass-panel" style={{ width: '95%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', position: 'relative', background: '#0f172a' }} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                    <X size={24} />
                </button>

                <header style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ margin: 0 }}>Pedido {currentOrder.orderNumber}</h2>
                            <p style={{ color: 'var(--text-muted)', margin: 0 }}>{currentOrder.date} • {currentOrder.customerName}</p>
                        </div>
                        <div style={{ padding: '0.5rem 1rem', borderRadius: '20px', background: isClosed ? 'var(--success-color)' : 'var(--primary-color)', fontWeight: 'bold' }}>
                            {currentOrder.status}
                        </div>
                    </div>
                </header>

                {/* Workflow Actions */}
                {!isClosed && (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {currentOrder.status === 'Recibido' && (
                            <button
                                className="btn btn-primary"
                                onClick={() => handleStatusChange('status', 'En Proceso')}
                            >
                                <Play size={18} /> Iniciar Proceso
                            </button>
                        )}

                        {(currentOrder.status === 'En Proceso' || currentOrder.status === 'Recibido') && ( /* Allow changing if 'Recibido' too? Logic says Received -> In Process -> Bifurcate. Let's assume user must click "Start Process" first, or we allow direct toggles which auto-move it. I will force "Start Process" first for clarity but could be flexible. Let's allow flexible. */
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: currentOrder.isDelivered ? 'rgba(16, 185, 129, 0.2)' : 'transparent', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                    <input
                                        type="checkbox"
                                        id="chk-delivered"
                                        checked={currentOrder.isDelivered}
                                        onChange={(e) => handleStatusChange('isDelivered', e.target.checked)}
                                        style={{ transform: 'scale(1.5)', accentColor: 'var(--success-color)' }}
                                    />
                                    <label htmlFor="chk-delivered" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Truck size={18} /> Entregado
                                    </label>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: currentOrder.isPaid ? 'rgba(16, 185, 129, 0.2)' : 'transparent', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                    <input
                                        type="checkbox"
                                        id="chk-paid"
                                        checked={currentOrder.isPaid}
                                        onChange={(e) => handleStatusChange('isPaid', e.target.checked)}
                                        style={{ transform: 'scale(1.5)', accentColor: 'var(--success-color)' }}
                                    />
                                    <label htmlFor="chk-paid" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <CreditCard size={18} /> Pagado
                                    </label>
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <div>
                        <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Items</h3>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {currentOrder.items.map((item) => (
                                <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{item.quantity} x {item.description}</div>
                                    </div>
                                    <div style={{ color: 'var(--text-muted)' }}>S/ {item.amount.toFixed(2)}</div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', height: 'fit-content' }}>
                        <h3 style={{ marginTop: 0 }}>Resumen Financiero</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Total Importe:</span>
                            <span>S/ {currentOrder.totalAmount.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Total Adelanto:</span>
                            <span>S/ {currentOrder.totalAdvance.toFixed(2)}</span>
                        </div>
                        <div style={{ borderTop: '1px solid var(--glass-border)', margin: '1rem 0' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                            <span>Saldo a Favor:</span>
                            <span>S/ {currentOrder.totalBalance.toFixed(2)}</span>
                        </div>
                        <div style={{ marginTop: '2rem' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Fecha Entrega:</div>
                            <div style={{ fontSize: '1.1rem' }}>{currentOrder.deliveryDate}</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
