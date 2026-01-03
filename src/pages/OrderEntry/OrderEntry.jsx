import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, User, Save } from 'lucide-react';
import { OrderService } from '../../services';
import { useNavigate } from 'react-router-dom';

export const OrderEntry = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        customerName: '',
        date: new Date().toISOString().split('T')[0],
        deliveryDate: '',
    });

    const [items, setItems] = useState([
        { id: Date.now(), description: '', quantity: 1, amount: 0, advance: 0 }
    ]);

    const [notification, setNotification] = useState(null);

    const handleHeadChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (id, field, value) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const addItem = () => {
        setItems(prev => [...prev, { id: Date.now(), description: '', quantity: 1, amount: 0, advance: 0 }]);
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
        if (!formData.customerName || !formData.deliveryDate) {
            setNotification({ type: 'error', message: 'Por favor complete los datos del cliente y entrega.' });
            return;
        }

        try {
            await OrderService.createOrder({
                ...formData,
                items: items.map(i => ({
                    ...i,
                    quantity: Number(i.quantity),
                    amount: Number(i.amount),
                    advance: Number(i.advance)
                }))
            });
            setNotification({ type: 'success', message: '¡Pedido registrado correctamente!' });
            setTimeout(() => navigate('/dashboard'), 1500);
        } catch (error) {
            console.error(error);
            setNotification({ type: 'error', message: 'Hubo un error al guardar en Strapi.' });
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '2.5rem', marginTop: '1rem' }}>
            <header style={{ marginBottom: '2.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.8rem', fontWeight: '800' }}>
                    <Plus size={32} style={{ color: 'var(--primary-color)' }} />
                    Nuevo Pedido
                </h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1rem' }}>Ingresa la información básica y los items para el nuevo servicio.</p>
            </header>

            {notification && (
                <div style={{
                    padding: '1.2rem',
                    marginBottom: '2rem',
                    borderRadius: 'var(--radius-md)',
                    background: notification.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    border: `1px solid ${notification.type === 'error' ? 'var(--danger-color)' : 'var(--success-color)'}`,
                    color: notification.type === 'error' ? '#fecaca' : '#d1fae5',
                    textAlign: 'center',
                    fontWeight: '600'
                }}>
                    {notification.message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="order-header-grid" style={{ marginBottom: '2.5rem' }}>
                    <div className="filter-group" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                            Nombre del Cliente
                        </label>
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
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                            Fecha de Registro
                        </label>
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
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                            Fecha Programada de Entrega
                        </label>
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
                            <Plus size={16} /> Añadir Item
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
                        {items.map((item, index) => (
                            <div key={item.id} className="glass-panel" style={{
                                padding: '1.5rem',
                                display: 'grid',
                                gap: '1.5rem',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                alignItems: 'end',
                                position: 'relative'
                            }}>
                                <div className="filter-group" style={{ minWidth: '80px', flex: '0 0 80px' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Cant.</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="input-field"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                    />
                                </div>
                                <div className="filter-group" style={{ minWidth: '200px' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Descripción</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Ej. Taza personalizada, Camisa..."
                                        value={item.description}
                                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                    />
                                </div>
                                <div className="filter-group">
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Precio Unit. (S/)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="input-field"
                                        value={item.amount}
                                        onChange={(e) => handleItemChange(item.id, 'amount', e.target.value)}
                                    />
                                </div>
                                <div className="filter-group">
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Adelanto (S/)</label>
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
                                            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}
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

                <div className="glass-panel" style={{
                    padding: '2rem',
                    marginBottom: '2.5rem',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '3rem',
                    flexWrap: 'wrap',
                    background: 'rgba(99, 102, 241, 0.05)'
                }}>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Monto Total</span>
                        <span style={{ fontSize: '1.8rem', fontWeight: '900' }}>S/ {totals.amount.toFixed(2)}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Adelantado</span>
                        <span style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--success-color)' }}>S/ {totals.advance.toFixed(2)}</span>
                    </div>
                    <div style={{ textAlign: 'right', borderLeft: '2px solid var(--glass-border)', paddingLeft: '3rem' }}>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Saldo Restante</span>
                        <span style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--primary-color)' }}>S/ {totalBalance.toFixed(2)}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '1rem 4rem', fontSize: '1.1rem', borderRadius: 'var(--radius-lg)' }}>
                        <Save size={22} style={{ marginRight: '10px' }} /> Guardar</button>
                </div>
            </form>
        </div>
    );
};
