import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Save, Search } from 'lucide-react';
import { OrderService } from '../../services';
import { useToast } from '../../context/ToastContext';
import { InventoryPickerModal } from '../Inventory/InventoryPickerModal';
import { AlertDialog } from '../common/AlertDialog';

export const NewOrderModal = ({ isOpen, onClose, onOrderCreated }) => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        customerName: '',
        date: new Date().toISOString().split('T')[0],
        deliveryDate: '',
    });

    const [items, setItems] = useState([
        { id: Date.now(), description: '', quantity: 1, unitPrice: 0, amount: 0, inventoryItemId: null, inventoryItemNumber: null, inventoryStock: null }
    ]);
    const [advancePayment, setAdvancePayment] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    // Picker de inventario: id del item de pedido que está eligiendo
    const [pickerForItemId, setPickerForItemId] = useState(null);

    // AlertDialog
    const [alertDialog, setAlertDialog] = useState({ isOpen: false, message: '', type: 'warning', title: '' });
    const showAlert = (message, type = 'warning', title = '') => setAlertDialog({ isOpen: true, message, type, title });
    const closeAlert = () => setAlertDialog(prev => ({ ...prev, isOpen: false }));

    const handleHeadChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (id, field, value) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item;

            // Validar stock máximo si el item tiene inventario vinculado
            if (field === 'quantity' && item.inventoryStock != null) {
                const qty = parseInt(value) || 1;
                if (qty > item.inventoryStock) {
                    showAlert(
                        `Stock disponible: ${item.inventoryStock} unidades. No puedes pedir más de lo disponible.`,
                        'warning',
                        'Stock insuficiente'
                    );
                    const capped = { ...item, quantity: item.inventoryStock };
                    capped.amount = item.inventoryStock * (Number(item.unitPrice) || 0);
                    return capped;
                }
            }

            const updatedItem = { ...item, [field]: value };
            if (field === 'quantity' || field === 'unitPrice') {
                updatedItem.amount = (Number(updatedItem.quantity) || 0) * (Number(updatedItem.unitPrice) || 0);
            }
            return updatedItem;
        }));
    };

    // Selección desde el picker de inventario
    const handleInventorySelect = (inventoryItem) => {
        if (!pickerForItemId) return;

        const parts = [inventoryItem.tipo, inventoryItem.material, inventoryItem.modelo, inventoryItem.size, inventoryItem.color]
            .filter(Boolean);
        const description = parts.length > 0 ? parts.join(' - ') : inventoryItem.itemNumber;

        setItems(prev => prev.map(item => {
            if (item.id !== pickerForItemId) return item;
            const qty = Math.min(Number(item.quantity) || 1, inventoryItem.quantity);
            return {
                ...item,
                description,
                unitPrice: inventoryItem.unit_price,
                amount: qty * inventoryItem.unit_price,
                quantity: qty,
                inventoryItemId: inventoryItem.id,
                inventoryItemNumber: inventoryItem.itemNumber,
                inventoryStock: inventoryItem.quantity
            };
        }));
        setPickerForItemId(null);
    };

    const addItem = () => {
        setItems(prev => [...prev, {
            id: Date.now(), description: '', quantity: 1, unitPrice: 0, amount: 0,
            inventoryItemId: null, inventoryItemNumber: null, inventoryStock: null
        }]);
    };

    const removeItem = (id) => {
        if (items.length > 1) {
            setItems(prev => prev.filter(item => item.id !== id));
        }
    };

    const totalAmount = items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    const totalAdvance = Number(advancePayment) || 0;
    const totalBalance = totalAmount - totalAdvance;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving) return;

        if (!formData.customerName || !formData.deliveryDate) {
            showToast('⚠️ Por favor complete los datos del cliente y entrega.', 'warning');
            return;
        }

        if (totalAdvance > totalAmount) {
            showToast('⚠️ El adelanto no puede superar el monto total (S/ ' + totalAmount.toFixed(2) + ')', 'warning');
            return;
        }

        setIsSaving(true);
        try {
            const newOrder = await OrderService.createOrder({
                ...formData,
                totalAdvance: totalAdvance,
                items: items.map(i => ({
                    ...i,
                    quantity: Number(i.quantity),
                    unitPrice: Number(i.unitPrice),
                    amount: Number(i.amount),
                    inventoryItemId: i.inventoryItemId || null   // ← preservar vínculo
                }))
            });

            showToast('🎉 ¡Pedido registrado correctamente!');
            setIsSaving(false);
            onOrderCreated(newOrder);
            handleClose();
        } catch (error) {
            console.error(error);
            showToast('❌ Error al guardar: ' + (error.message || 'Hubo un error en la base de datos'), 'error');
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setFormData({
            customerName: '',
            date: new Date().toISOString().split('T')[0],
            deliveryDate: '',
        });
        setItems([{ id: Date.now(), description: '', quantity: 1, unitPrice: 0, amount: 0, inventoryItemId: null, inventoryItemNumber: null, inventoryStock: null }]);
        setAdvancePayment(0);
        onClose();
    };

    // ESC key listener
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape' && isOpen && !isSaving && !pickerForItemId) {
                handleClose();
            }
        };
        if (isOpen) document.addEventListener('keydown', handleEscKey);
        return () => document.removeEventListener('keydown', handleEscKey);
    }, [isOpen, isSaving, pickerForItemId]);

    if (!isOpen) return null;

    return (
        <>
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
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1rem' }}>
                            Ingresa la información básica y los items para el nuevo servicio.
                        </p>
                    </header>

                    <form onSubmit={handleSubmit} className="modal-body">
                        {/* Cabecera del pedido */}
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
                                <label>Fecha de Entrega</label>
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

                        {/* Items */}
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700' }}>Detalle de Items</h3>
                                <button type="button" onClick={addItem} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                                    <Plus size={16} /> <span>Añadir Item</span>
                                </button>
                            </div>

                            <div className="items-container">
                                {items.map((item) => (
                                    <div key={item.id} className="order-item-row">
                                        {/* Cantidad */}
                                        <div className="filter-group">
                                            <label>Cant.</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max={item.inventoryStock != null ? item.inventoryStock : undefined}
                                                className="input-field"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                                title={item.inventoryStock != null ? `Stock disponible: ${item.inventoryStock}` : undefined}
                                            />
                                            {/* Indicador de stock */}
                                            {item.inventoryStock != null && (
                                                <div style={{
                                                    marginTop: '0.2rem',
                                                    fontSize: '0.7rem',
                                                    fontWeight: '600',
                                                    textAlign: 'center',
                                                    color: parseInt(item.quantity) >= item.inventoryStock
                                                        ? 'var(--danger-color, #ef4444)'
                                                        : 'var(--text-muted)'
                                                }}>
                                                    Stock: {item.inventoryStock}
                                                </div>
                                            )}
                                        </div>

                                        {/* Descripción + lupa */}
                                        <div className="filter-group">
                                            <label>Descripción</label>
                                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                <input
                                                    type="text"
                                                    className="input-field"
                                                    placeholder="Ej. Taza personalizada, Camisa..."
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                    style={{ flex: 1 }}
                                                />
                                                {/* Botón lupa inventario */}
                                                <button
                                                    type="button"
                                                    onClick={() => setPickerForItemId(item.id)}
                                                    className="btn-icon"
                                                    title="Buscar en inventario"
                                                    style={{
                                                        flexShrink: 0,
                                                        background: item.inventoryItemId ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                                                        border: `1px solid ${item.inventoryItemId ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                                        color: item.inventoryItemId ? 'var(--primary-color)' : 'var(--text-muted)',
                                                        padding: '0.55rem',
                                                        borderRadius: '8px'
                                                    }}
                                                >
                                                    <Search size={15} />
                                                </button>
                                            </div>
                                            {/* Badge del item vinculado */}
                                            {item.inventoryItemNumber && (
                                                <div style={{
                                                    marginTop: '0.3rem',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem',
                                                    padding: '0.2rem 0.5rem',
                                                    background: 'var(--primary-light)',
                                                    border: '1px solid var(--primary-color)',
                                                    borderRadius: '4px',
                                                    fontSize: '0.72rem',
                                                    color: 'var(--primary-color)',
                                                    fontWeight: '600'
                                                }}>
                                                    📦 {item.inventoryItemNumber}
                                                </div>
                                            )}
                                        </div>

                                        {/* Precio unitario */}
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

                                        {/* Subtotal (readonly) */}
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

                                        {/* Botón eliminar */}
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

                        {/* Adelanto global */}
                        <div style={{
                            marginBottom: '2rem',
                            padding: '1.5rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1.5rem',
                            flexWrap: 'wrap'
                        }}>
                            <div className="filter-group" style={{ margin: 0, minWidth: '200px' }}>
                                <label className="input-label" style={{ fontWeight: '700', color: 'var(--success-color)' }}>ADELANTO (S/)</label>
                                <input
                                    type="number"
                                    value={advancePayment}
                                    onChange={(e) => setAdvancePayment(e.target.value)}
                                    className="input-field"
                                    min="0"
                                    step="0.01"
                                    style={{ borderColor: 'var(--success-color)', fontSize: '1.1rem', fontWeight: '700' }}
                                />
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-muted)', flex: 1 }}>
                                El monto adelantado aplica para todo el pedido.
                            </div>
                        </div>

                        {/* Totales */}
                        <div className="order-summary-totals">
                            <div className="summary-item">
                                <span className="summary-label">Monto Total</span>
                                <span className="summary-value">S/ {totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="summary-item success">
                                <span className="summary-label">Adelantado</span>
                                <span className="summary-value">S/ {totalAdvance.toFixed(2)}</span>
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

            {/* Picker de inventario */}
            {pickerForItemId && (
                <InventoryPickerModal
                    onClose={() => setPickerForItemId(null)}
                    onSelect={handleInventorySelect}
                />
            )}

            {/* AlertDialog */}
            <AlertDialog
                isOpen={alertDialog.isOpen}
                onClose={closeAlert}
                title={alertDialog.title}
                message={alertDialog.message}
                type={alertDialog.type}
            />
        </>
    );
};
