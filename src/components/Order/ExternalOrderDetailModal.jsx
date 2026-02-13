import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { ExternalOrderService } from '../../services/ExternalOrderService';

export const ExternalOrderDetailModal = ({ order, onClose, onUpdate }) => {
    const [items, setItems] = useState(order.items || []);
    const [isLoading, setIsLoading] = useState(false);

    const handleItemChange = (itemId, field, value) => {
        setItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId
                    ? {
                        ...item,
                        [field]: value,
                        // Recalculate total price if needed (though it's usually just qty * unit)
                        totalPrice: (field === 'quantity' || field === 'unitPrice')
                            ? (field === 'quantity' ? parseFloat(value) : item.quantity) *
                            (field === 'unitPrice' ? parseFloat(value) : item.unitPrice)
                            : item.totalPrice
                    }
                    : item
            )
        );
    };

    const handleSaveChanges = async () => {
        setIsLoading(true);
        try {
            // Actualizar cada item que haya cambiado
            const updatePromises = items.map(async (item) => {
                const originalItem = order.items.find(o => o.id === item.id);
                if (!originalItem) return null;

                const hasChanged =
                    originalItem.quantity !== item.quantity ||
                    originalItem.unitPrice !== item.unitPrice ||
                    originalItem.advancePayment !== item.advancePayment; // Changed from shippingCost

                if (hasChanged) {
                    return await ExternalOrderService.updateExternalOrderItem(item.id, {
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        advancePayment: item.advancePayment // Changed from shippingCost
                    });
                }
                return null;
            });

            await Promise.all(updatePromises);

            // Obtener el pedido actualizado
            const updatedOrder = await ExternalOrderService.getExternalOrderById(order.id);
            onUpdate(updatedOrder);
            onClose();
        } catch (error) {
            console.error('Error saving changes:', error);
            alert('Error al guardar los cambios: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    };

    const calculateTotalAdvance = () => {
        return items.reduce((sum, item) => sum + (parseFloat(item.advancePayment) || 0), 0);
    };

    const calculateBalance = () => {
        return calculateTotal() - calculateTotalAdvance();
    };

    // Format Date helper
    const formatDate = (dateString) => {
        if (!dateString) return 'No especificada';
        return new Date(dateString).toLocaleDateString('es-PE');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
                <div className="modal-header">
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                            Detalle de Pedido Externo
                        </h2>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            ID: {order.orderNumber}
                        </p>
                    </div>
                    <button onClick={onClose} className="modal-close">
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {/* Información del Cliente */}
                    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Información del Cliente
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.95rem' }}>
                            <div>
                                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nombre del Cliente</span>
                                <strong style={{ fontSize: '1.1rem' }}>{order.customerName}</strong>
                            </div>
                            <div>
                                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Teléfono</span>
                                <strong style={{ fontSize: '1.1rem' }}>{order.phone}</strong>
                            </div>
                            <div>
                                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fecha de Registro</span>
                                <strong style={{ fontSize: '1.1rem' }}>{formatDate(order.orderDate || order.createdAt)}</strong>
                            </div>
                            <div>
                                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fecha Programada</span>
                                <strong style={{ fontSize: '1.1rem' }}>{formatDate(order.scheduledDeliveryDate)}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Items del Pedido */}
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Productos del Pedido
                        </h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'center', width: '80px' }}>Cant.</th>
                                        <th style={{ minWidth: '200px' }}>Descripción</th>
                                        <th style={{ textAlign: 'right', width: '130px' }}>Precio Unit. (S/)</th>
                                        <th style={{ textAlign: 'right', width: '130px' }}>Subtotal (S/)</th>
                                        <th style={{ textAlign: 'right', width: '130px' }}>Adelanto (S/)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr key={item.id}>
                                            <td style={{ textAlign: 'center' }}>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                                    className="input-field"
                                                    min="1"
                                                    style={{ width: '100%', textAlign: 'center', padding: '0.3rem' }}
                                                />
                                            </td>
                                            <td style={{ fontWeight: '600' }}>{item.product}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <input
                                                    type="number"
                                                    value={item.unitPrice}
                                                    onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                    className="input-field"
                                                    min="0"
                                                    step="0.01"
                                                    style={{ width: '100%', textAlign: 'right', padding: '0.3rem' }}
                                                />
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--primary-color)' }}>
                                                S/ {(item.quantity * item.unitPrice).toFixed(2)}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <input
                                                    type="number"
                                                    value={item.advancePayment}
                                                    onChange={(e) => handleItemChange(item.id, 'advancePayment', parseFloat(e.target.value) || 0)}
                                                    className="input-field"
                                                    min="0"
                                                    step="0.01"
                                                    style={{ width: '100%', textAlign: 'right', padding: '0.3rem' }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Resumen de Totales */}
                        <div style={{
                            marginTop: '1.5rem',
                            padding: '1.5rem',
                            background: 'var(--glass-bg)',
                            borderRadius: '12px',
                            border: '1px solid var(--glass-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ textAlign: 'right', flex: 1, paddingRight: '2rem' }}>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    MONTO TOTAL
                                </p>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-color)' }}>
                                    S/ {calculateTotal().toFixed(2)}
                                </p>
                            </div>
                            <div style={{ textAlign: 'right', flex: 1, paddingRight: '2rem', borderRight: '1px solid var(--border-color)', borderLeft: '1px solid var(--border-color)' }}>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--success-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    ADELANTADO
                                </p>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '1.5rem', fontWeight: '700', color: 'var(--success-color)' }}>
                                    S/ {calculateTotalAdvance().toFixed(2)}
                                </p>
                            </div>
                            <div style={{ textAlign: 'right', flex: 1 }}>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    SALDO RESTANTE
                                </p>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                                    S/ {calculateBalance().toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} className="btn btn-secondary">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSaveChanges}
                        className="btn btn-primary"
                        disabled={isLoading}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        {isLoading ? (
                            <>
                                <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
