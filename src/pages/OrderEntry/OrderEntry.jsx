import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Calculator, Calendar, User, DollarSign } from 'lucide-react';
import { OrderService } from '../../services/OrderService';
import { useNavigate } from 'react-router-dom';

export const OrderEntry = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        customerName: '',
    });

    const [items, setItems] = useState([
        { id: Date.now().toString(), description: '', quantity: 1, amount: 0, advance: 0 }
    ]);

    const [notification, setNotification] = useState(null);

    const handleHeadChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleItemChange = (id, field, value) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const addItem = () => {
        setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, amount: 0, advance: 0 }]);
    };

    const removeItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const totals = items.reduce((acc, item) => ({
        amount: acc.amount + (parseFloat(item.amount) || 0),
        advance: acc.advance + (parseFloat(item.advance) || 0)
    }), { amount: 0, advance: 0 });

    const totalBalance = totals.amount - totals.advance;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.customerName || !formData.deliveryDate) {
            setNotification({ type: 'error', message: 'Por favor complete los datos del cliente y entrega.' });
            return;
        }

        // Validate items
        const invalidItems = items.some(i => !i.description || i.amount <= 0);
        if (invalidItems) {
            setNotification({ type: 'error', message: 'Por favor complete el detalle de los items (Descripción y Monto).' });
            return;
        }

        try {
            OrderService.createOrder({
                ...formData,
                items: items.map(i => ({
                    ...i,
                    quantity: Number(i.quantity),
                    amount: Number(i.amount),
                    advance: Number(i.advance)
                }))
            });
            setNotification({ type: 'success', message: 'Pedido guardado con éxito!' });
            setTimeout(() => navigate('/dashboard'), 1500);
        } catch (error) {
            console.error(error);
            setNotification({ type: 'error', message: 'Error al guardar el pedido.' });
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
            <header style={{ marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={28} className="text-primary" style={{ color: 'var(--primary-color)' }} />
                    Nuevo Pedido de Ingreso
                </h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Complete los datos del pedido y agregue los items necesarios.</p>
            </header>

            {notification && (
                <div style={{
                    padding: '1rem',
                    marginBottom: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: notification.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    border: `1px solid ${notification.type === 'error' ? 'var(--danger-color)' : 'var(--success-color)'}`,
                    color: 'white'
                }}>
                    {notification.message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Header Data */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            <User size={14} style={{ display: 'inline', marginRight: '4px' }} /> Nombre Cliente
                        </label>
                        <input
                            type="text"
                            name="customerName"
                            className="input-field"
                            placeholder="Ej. Juan Pérez"
                            value={formData.customerName}
                            onChange={handleHeadChange}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} /> Fecha Pedido
                        </label>
                        <input
                            type="date"
                            name="date"
                            className="input-field"
                            value={formData.date}
                            onChange={handleHeadChange}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} /> Fecha Entrega
                        </label>
                        <input
                            type="date"
                            name="deliveryDate"
                            className="input-field"
                            value={formData.deliveryDate}
                            onChange={handleHeadChange}
                        />
                    </div>
                </div>

                {/* Items List */}
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-color)' }}>Detalle del Pedido</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    {items.map((item, index) => (
                        <div key={item.id} className="glass-panel order-item-grid">
                            <div className="order-item-qty">
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cant.</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="input-field"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                />
                            </div>
                            <div className="order-item-desc">
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Descripción</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Producto o Servicio"
                                    value={item.description}
                                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                />
                            </div>
                            <div className="order-item-amount">
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Monto</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>S/</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="input-field"
                                        style={{ paddingLeft: '30px' }}
                                        value={item.amount}
                                        onChange={(e) => handleItemChange(item.id, 'amount', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="order-item-advance">
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Adelanto</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>S/</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="input-field"
                                        style={{ paddingLeft: '30px' }}
                                        value={item.advance}
                                        onChange={(e) => handleItemChange(item.id, 'advance', e.target.value)}
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="btn order-item-action"
                                style={{ color: 'var(--danger-color)', padding: '0.5rem', height: '42px' }}
                                title="Eliminar Item"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}

                    <button type="button" onClick={addItem} className="btn btn-secondary" style={{ alignSelf: 'start' }}>
                        <Plus size={18} /> Agregar Item
                    </button>
                </div>

                {/* Totals Section */}
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '3rem', background: 'rgba(99, 102, 241, 0.1)' }}>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Monto</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>S/ {totals.amount.toFixed(2)}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Adelanto</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>S/ {totals.advance.toFixed(2)}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Saldo a Favor</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>S/ {totalBalance.toFixed(2)}</span>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
                        <Save size={20} /> Guardar Pedido
                    </button>
                </div>

            </form>
        </div>
    );
};
