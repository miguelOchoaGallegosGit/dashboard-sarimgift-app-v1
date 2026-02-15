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
            <div className="modal-content add-inventory-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                            Detalle de Pedido Externo
                        </h2>
                        <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            ID: {order.orderNumber}
                        </p>
                    </div>
                    <button onClick={onClose} className="btn-icon">
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Información del Cliente */}
                    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Información del Cliente
                        </h3>
                        <div className="inventory-form-grid">
                            <div className="form-column">
                                <div className="filter-group">
                                    <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nombre del Cliente</span>
                                    <strong style={{ fontSize: '1.1rem' }}>{order.customerName}</strong>
                                </div>
                                <div className="filter-group">
                                    <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Teléfono</span>
                                    <strong style={{ fontSize: '1.1rem' }}>{order.phone}</strong>
                                </div>
                            </div>
                            <div className="form-column">
                                <div className="filter-group">
                                    <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fecha de Registro</span>
                                    <strong style={{ fontSize: '1.1rem' }}>{formatDate(order.orderDate || order.createdAt)}</strong>
                                </div>
                                <div className="filter-group">
                                    <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fecha Programada</span>
                                    <strong style={{ fontSize: '1.1rem' }}>{formatDate(order.scheduledDeliveryDate)}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items del Pedido */}
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Productos del Pedido
                        </h3>

                        <div className="items-list grid-style">
                            {/* Header del grid para Desktop */}
                            <div className="item-row quotation hide-on-mobile" style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: 0, padding: '0.75rem 1rem', borderBottom: '2px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Cant.</div>
                                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Descripción</div>
                                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>P. Unit (S/)</div>
                                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Subtotal (S/)</div>
                                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Adelanto (S/)</div>
                            </div>

                            {items.map((item) => (
                                <div key={item.id} className="item-row quotation">
                                    <div className="filter-group">
                                        <label className="input-label hide-on-desktop">Cant.</label>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                            className="input-field"
                                            min="1"
                                            style={{ textAlign: 'center' }}
                                        />
                                    </div>
                                    <div className="filter-group">
                                        <label className="input-label hide-on-desktop">Descripción</label>
                                        <div className="input-field" style={{ background: 'var(--bg-tertiary)', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                                            {item.product}
                                        </div>
                                    </div>
                                    <div className="filter-group">
                                        <label className="input-label hide-on-desktop">P. Unit. (S/)</label>
                                        <input
                                            type="number"
                                            value={item.unitPrice}
                                            onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                            className="input-field"
                                            min="0"
                                            step="0.01"
                                            style={{ textAlign: 'right' }}
                                        />
                                    </div>
                                    <div className="filter-group">
                                        <label className="input-label hide-on-desktop">Subtotal (S/)</label>
                                        <div style={{
                                            height: '48px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-end',
                                            fontWeight: '700',
                                            fontSize: '1rem',
                                            color: 'var(--primary-color)',
                                            background: 'var(--bg-tertiary)',
                                            padding: '0 1rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            {(item.quantity * item.unitPrice).toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="filter-group">
                                        <label className="input-label hide-on-desktop">Adelanto (S/)</label>
                                        <input
                                            type="number"
                                            value={item.advancePayment}
                                            onChange={(e) => handleItemChange(item.id, 'advancePayment', parseFloat(e.target.value) || 0)}
                                            className="input-field"
                                            min="0"
                                            step="0.01"
                                            style={{ textAlign: 'right' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Resumen de Totales */}
                        <div style={{
                            marginTop: '1.5rem',
                            padding: '1.5rem',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '1.5rem'
                        }}>
                            <div style={{ flex: 1, minWidth: '150px' }}>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    MONTO TOTAL
                                </p>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-color)' }}>
                                    S/ {calculateTotal().toFixed(2)}
                                </p>
                            </div>
                            <div style={{ flex: 1, minWidth: '150px' }}>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--success-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    ADELANTADO
                                </p>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '1.5rem', fontWeight: '800', color: 'var(--success-color)' }}>
                                    S/ {calculateTotalAdvance().toFixed(2)}
                                </p>
                            </div>
                            <div style={{ flex: 1, minWidth: '150px' }}>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    SALDO RESTANTE
                                </p>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-color)' }}>
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
