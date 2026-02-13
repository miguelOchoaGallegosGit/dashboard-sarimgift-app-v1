import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { QuotationService } from '../../services/QuotationService';

export const NewQuotationModal = ({ isOpen, onClose, onQuotationCreated }) => {
    const [customerName, setCustomerName] = useState('');
    const [phone, setPhone] = useState('');
    // registrationDate se asigna automáticamente, no es necesario que el usuario lo ingrese
    const [scheduledDeliveryDate, setScheduledDeliveryDate] = useState('');
    const [items, setItems] = useState([{
        id: Date.now(),
        product: '',
        quantity: 1,
        unitPrice: 0,
        advancePayment: 0
    }]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleAddItem = () => {
        setItems([...items, {
            id: Date.now(),
            product: '',
            quantity: 1,
            unitPrice: 0,
            advancePayment: 0
        }]);
    };

    const handleRemoveItem = (id) => {
        if (items.length === 1) {
            alert('Debe haber al menos un producto');
            return;
        }
        setItems(items.filter(item => item.id !== id));
    };

    const handleItemChange = (id, field, value) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const calculateItemTotal = (item) => {
        return (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    };

    const calculateTotalAdvance = () => {
        return items.reduce((sum, item) => sum + (parseFloat(item.advancePayment) || 0), 0);
    };

    const calculateBalance = () => {
        return calculateTotal() - calculateTotalAdvance();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validaciones
        if (!customerName.trim()) {
            alert('El nombre del cliente es requerido');
            return;
        }

        if (!phone.trim()) {
            alert('El teléfono es requerido');
            return;
        }

        const validItems = items.filter(item => item.product.trim() !== '');
        if (validItems.length === 0) {
            alert('Debe agregar al menos un producto');
            return;
        }

        setIsLoading(true);
        try {
            const quotationData = {
                customerName: customerName.trim(),
                phone: phone.trim(),
                registrationDate: new Date().toISOString().split('T')[0], // Fecha actual del sistema
                scheduledDeliveryDate: scheduledDeliveryDate || null,
                items: validItems.map(item => ({
                    product: item.product.trim(),
                    quantity: parseInt(item.quantity) || 1,
                    unitPrice: parseFloat(item.unitPrice) || 0,
                    advancePayment: parseFloat(item.advancePayment) || 0
                }))
            };

            const newQuotation = await QuotationService.createQuotation(quotationData);
            onQuotationCreated(newQuotation);
            handleClose();
        } catch (error) {
            console.error('Error creating quotation:', error);
            alert('Error al crear la cotización: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setCustomerName('');
        setPhone('');
        setScheduledDeliveryDate('');
        setItems([{
            id: Date.now(),
            product: '',
            quantity: 1,
            unitPrice: 0,
            advancePayment: 0
        }]);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1000px' }}>
                <div className="modal-header">
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                        Ingresar Cotización
                    </h2>
                    <button onClick={handleClose} className="modal-close">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        {/* Información del Cliente */}
                        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="input-label">Nombre del Cliente *</label>
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        className="input-field"
                                        placeholder="Ej. Alejandro Juárez"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Teléfono *</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, ''); // Solo números
                                            if (value.length <= 9) {
                                                setPhone(value);
                                            }
                                        }}
                                        className="input-field"
                                        placeholder="987654321"
                                        maxLength={9}
                                        pattern="[0-9]{9}"
                                        required
                                    />
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                        9 dígitos
                                    </p>
                                </div>
                                <div>
                                    <label className="input-label">Fecha Programada de Entrega</label>
                                    <input
                                        type="date"
                                        value={scheduledDeliveryDate}
                                        onChange={(e) => setScheduledDeliveryDate(e.target.value)}
                                        className="input-field"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Detalle de Items */}
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Detalle de Items
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="btn btn-secondary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                                >
                                    <Plus size={16} />
                                    Añadir Item
                                </button>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table className="data-table" style={{ width: '100%', marginBottom: '0' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'center', width: '80px' }}>Cant.</th>
                                            <th style={{ minWidth: '250px' }}>Descripción</th>
                                            <th style={{ textAlign: 'right', width: '130px' }}>Precio Unit. (S/)</th>
                                            <th style={{ textAlign: 'right', width: '130px' }}>Subtotal (S/)</th>
                                            <th style={{ textAlign: 'right', width: '130px' }}>Adelanto (S/)</th>
                                            <th style={{ textAlign: 'center', width: '50px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item) => (
                                            <tr key={item.id}>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                                        className="input-field"
                                                        min="1"
                                                        style={{ width: '100%', textAlign: 'center', padding: '0.5rem' }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={item.product}
                                                        onChange={(e) => handleItemChange(item.id, 'product', e.target.value)}
                                                        className="input-field"
                                                        placeholder="Ej. Taza personalizada, Camisa..."
                                                        style={{ padding: '0.5rem' }}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <input
                                                        type="number"
                                                        value={item.unitPrice}
                                                        onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                                                        className="input-field"
                                                        min="0"
                                                        step="0.01"
                                                        style={{ width: '100%', textAlign: 'right', padding: '0.5rem' }}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: '700', fontSize: '1rem', color: 'var(--primary-color)' }}>
                                                    {calculateItemTotal(item).toFixed(2)}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <input
                                                        type="number"
                                                        value={item.advancePayment}
                                                        onChange={(e) => handleItemChange(item.id, 'advancePayment', e.target.value)}
                                                        className="input-field"
                                                        min="0"
                                                        step="0.01"
                                                        style={{ width: '100%', textAlign: 'right', padding: '0.5rem' }}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="btn-icon"
                                                        style={{
                                                            padding: '0.5rem',
                                                            color: 'var(--danger-color)',
                                                            background: 'transparent',
                                                            border: 'none',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
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
                        <button type="button" onClick={handleClose} className="btn btn-secondary">
                            Cancelar
                        </button>
                        <button
                            type="submit"
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
                                    Guardar Cotización
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
