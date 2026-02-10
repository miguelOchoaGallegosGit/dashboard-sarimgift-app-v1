import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Save } from 'lucide-react';
import { OrderService } from '../../services';

export const NewOrderModal = ({ isOpen, onClose, onOrderCreated }) => {
    const [formData, setFormData] = useState({
        customerName: '',
        date: new Date().toISOString().split('T')[0],
        deliveryDate: '',
    });

    const [items, setItems] = useState([
        { id: Date.now(), description: '', quantity: 1, unitPrice: 0, amount: 0, advance: 0 }
    ]);

    const [notification, setNotification] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleHeadChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (id, field, value) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'quantity' || field === 'unitPrice') {
                    updatedItem.amount = (Number(updatedItem.quantity) || 0) * (Number(updatedItem.unitPrice) || 0);
                }
                return updatedItem;
            }
            return item;
        }));
    };

    const addItem = () => {
        setItems(prev => [...prev, { id: Date.now(), description: '', quantity: 1, unitPrice: 0, amount: 0, advance: 0 }]);
    };

    const removeItem = (id) => {
        if (items.length > 1) {
            setItems(prev => prev.filter(item => item.id !== id));
        }
    };

    const totals = items.reduce((acc, item) => ({
        amount: acc.amount + (Number(item.amount) || 0),
        advance: acc.advance + (Number(item.advance) || 0)
    }), { amount: 0, advance: 0 });

    const totalBalance = totals.amount - totals.advance;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving) return;

        if (!formData.customerName || !formData.deliveryDate) {
            setNotification({ type: 'error', message: 'Por favor complete los datos del cliente y entrega.' });
            return;
        }

        setIsSaving(true);
        try {
            const newOrder = await OrderService.createOrder({
                ...formData,
                items: items.map(i => ({
                    ...i,
                    quantity: Number(i.quantity),
                    unitPrice: Number(i.unitPrice),
                    amount: Number(i.amount),
                    advance: Number(i.advance)
                }))
            });
            setNotification({ type: 'success', message: '¡Pedido registrado correctamente!' });
            setTimeout(() => {
                setIsSaving(false);
                onOrderCreated(newOrder);
                handleClose();
            }, 1500);
        } catch (error) {
            console.error(error);
            setNotification({ type: 'error', message: error.message || 'Hubo un error al guardar en la Base de Datos.' });
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setFormData({
            customerName: '',
            date: new Date().toISOString().split('T')[0],
            deliveryDate: '',
        });
        setItems([{ id: Date.now(), description: '', quantity: 1, unitPrice: 0, amount: 0, advance: 0 }]);
        setNotification(null);
        onClose();
    };

    // ESC key listener
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape' && isOpen && !isSaving) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen, isSaving]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-container new-order-modal" onClick={e => e.stopPropagation()}>
                <button onClick={handleClose} className="btn-icon modal-close">
                    <X size={24} />
                </button>

                <header className="modal-header">
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.8rem', fontWeight: '800' }}>
                        <Plus size={32} style={{ color: 'var(--primary-color)' }} />
                        Nuevo Pedido
                    </h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1rem' }}>Ingresa la información básica y los items para el nuevo servicio.</p>
                </header>

                {notification && (
                    <div className={`notification ${notification.type}`}>
                        {notification.message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="order-header-grid">
                        <div className="filter-group">
                            <label>Nombre del Cliente</label>
                            <input
                                type="text"
                                name="customerName"
                                className="input-field"
                                placeholder="Nombre completo..."
                                value={formData.customerName}
                                onChange={handleHeadChange}
                                required
                            />
                        </div>
                        <div className="filter-group">
                            <label>Fecha de Registro</label>
                            <input
                                type="date"
                                name="date"
                                className="input-field"
                                value={formData.date}
                                onChange={handleHeadChange}
                                required
                            />
                        </div>
                        <div className="filter-group">
                            <label>Fecha Programada de Entrega</label>
                            <input
                                type="date"
                                name="deliveryDate"
                                className="input-field"
                                value={formData.deliveryDate}
                                onChange={handleHeadChange}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700' }}>Detalle de Items</h3>
                            <button type="button" onClick={addItem} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                                <Plus size={16} /> <span>Añadir Item</span>
                            </button>
                        </div>

                        <div className="items-container">
                            {items.map((item, index) => (
                                <div key={item.id} className="order-item-row">
                                    <div className="filter-group">
                                        <label>Cant.</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="input-field"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                        />
                                    </div>
                                    <div className="filter-group">
                                        <label>Descripción</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Ej. Taza personalizada, Camisa..."
                                            value={item.description}
                                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                        />
                                    </div>
                                    <div className="filter-group">
                                        <label>Precio Unit. (S/)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="input-field"
                                            value={item.unitPrice}
                                            onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                                        />
                                    </div>
                                    <div className="filter-group">
                                        <label>Subtotal (S/)</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={item.amount}
                                            readOnly
                                            style={{ backgroundColor: 'var(--bg-tertiary)', cursor: 'not-allowed', color: 'var(--primary-color)', fontWeight: 'bold' }}
                                        />
                                    </div>
                                    <div className="filter-group">
                                        <label>Adelanto (S/)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="input-field"
                                            value={item.advance}
                                            onChange={(e) => handleItemChange(item.id, 'advance', e.target.value)}
                                        />
                                    </div>

                                    {items.length > 1 && (
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(item.id)}
                                                className="btn-icon"
                                                style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger-color)' }}
                                                title="Eliminar item"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="order-summary-totals">
                        <div className="summary-item">
                            <span className="summary-label">Monto Total</span>
                            <span className="summary-value">S/ {totals.amount.toFixed(2)}</span>
                        </div>
                        <div className="summary-item success">
                            <span className="summary-label">Adelantado</span>
                            <span className="summary-value">S/ {totals.advance.toFixed(2)}</span>
                        </div>
                        <div className="summary-item primary">
                            <span className="summary-label">Saldo Restante</span>
                            <span className="summary-value">S/ {totalBalance.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <div className="spinner" style={{ marginRight: '10px' }}></div>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save size={22} style={{ marginRight: '10px' }} />
                                    Guardar
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {isSaving && (
                    <div className="loading-overlay">
                        <div className="spinner"></div>
                        <div className="loading-text">Guardando Pedido...</div>
                    </div>
                )}
            </div>
        </div>
    );
};
