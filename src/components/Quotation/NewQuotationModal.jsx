import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Search } from 'lucide-react';
import { QuotationService } from '../../services/QuotationService';
import { InventoryPickerModal } from '../Inventory/InventoryPickerModal';
import { AlertDialog } from '../common/AlertDialog';

export const NewQuotationModal = ({ isOpen, onClose, onQuotationCreated }) => {
    const [customerName, setCustomerName] = useState('');
    const [phone, setPhone] = useState('');
    const [scheduledDeliveryDate, setScheduledDeliveryDate] = useState('');
    const [items, setItems] = useState([{
        id: Date.now(),
        product: '',
        quantity: 1,
        unitPrice: 0,
        inventoryItemId: null,
        inventoryItemNumber: null
    }]);
    const [advancePayment, setAdvancePayment] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    // Estado para el picker de inventario: guarda el id del item de cotización que está eligiendo
    const [pickerForItemId, setPickerForItemId] = useState(null);
    // Estado para AlertDialog
    const [alertDialog, setAlertDialog] = useState({ isOpen: false, message: '', type: 'warning', title: '' });

    const showAlert = (message, type = 'warning', title = '') => {
        setAlertDialog({ isOpen: true, message, type, title });
    };
    const closeAlert = () => setAlertDialog(prev => ({ ...prev, isOpen: false }));

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (pickerForItemId) return; // El picker maneja su propio ESC
                handleClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, pickerForItemId]);

    if (!isOpen) return null;

    const handleAddItem = () => {
        setItems([...items, {
            id: Date.now(),
            product: '',
            quantity: 1,
            unitPrice: 0,
            inventoryItemId: null,
            inventoryItemNumber: null
        }]);
    };

    const handleRemoveItem = (id) => {
        if (items.length === 1) {
            showAlert('Debe haber al menos un producto. Agrega otro ítem antes de eliminar este.', 'warning', 'Mínimo un producto');
            return;
        }
        setItems(items.filter(item => item.id !== id));
    };

    const handleItemChange = (id, field, value) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    // Cuando el usuario selecciona un item del inventario
    const handleInventorySelect = (inventoryItem) => {
        if (!pickerForItemId) return;

        // Construir descripción automática
        const parts = [inventoryItem.tipo, inventoryItem.material, inventoryItem.modelo, inventoryItem.size, inventoryItem.color]
            .filter(Boolean);
        const description = parts.length > 0 ? parts.join(' - ') : inventoryItem.itemNumber;

        setItems(items.map(item =>
            item.id === pickerForItemId
                ? {
                    ...item,
                    product: description,
                    unitPrice: inventoryItem.unit_price,
                    inventoryItemId: inventoryItem.id,
                    inventoryItemNumber: inventoryItem.itemNumber
                }
                : item
        ));
        setPickerForItemId(null);
    };

    const calculateItemTotal = (item) => {
        return (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    };

    const calculateTotalAdvance = () => {
        return parseFloat(advancePayment) || 0;
    };

    const calculateBalance = () => {
        return calculateTotal() - calculateTotalAdvance();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!customerName.trim()) {
            showAlert('El nombre del cliente es requerido para continuar.', 'warning', 'Campo requerido');
            return;
        }

        if (!phone.trim()) {
            showAlert('El teléfono es requerido para continuar.', 'warning', 'Campo requerido');
            return;
        }

        const validItems = items.filter(item => item.product.trim() !== '');
        if (validItems.length === 0) {
            showAlert('Debe agregar al menos un producto antes de guardar la cotización.', 'warning', 'Sin productos');
            return;
        }

        const total = calculateTotal();
        const advance = calculateTotalAdvance();
        if (advance > total) {
            showAlert(`El adelanto (S/ ${advance.toFixed(2)}) no puede superar el monto total de la cotización (S/ ${total.toFixed(2)}).`, 'error', 'Adelanto inválido');
            return;
        }

        setIsLoading(true);
        try {
            const quotationData = {
                customerName: customerName.trim(),
                phone: phone.trim(),
                registrationDate: new Date().toISOString().split('T')[0],
                scheduledDeliveryDate: scheduledDeliveryDate || null,
                advancePayment: parseFloat(advancePayment) || 0,
                items: validItems.map(item => ({
                    product: item.product.trim(),
                    quantity: parseInt(item.quantity) || 1,
                    unitPrice: parseFloat(item.unitPrice) || 0,
                    inventoryItemId: item.inventoryItemId || null
                }))
            };

            const newQuotation = await QuotationService.createQuotation(quotationData);
            onQuotationCreated(newQuotation);
            handleClose();
        } catch (error) {
            console.error('Error creating quotation:', error);
            showAlert('No se pudo crear la cotización: ' + error.message, 'error', 'Error al guardar');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setCustomerName('');
        setPhone('');
        setScheduledDeliveryDate('');
        setAdvancePayment(0);
        setItems([{
            id: Date.now(),
            product: '',
            quantity: 1,
            unitPrice: 0,
            inventoryItemId: null,
            inventoryItemNumber: null
        }]);
        setPickerForItemId(null);
        onClose();
    };

    return (
        <>
            <div className="modal-overlay" onClick={handleClose}>
                <div className="modal-content add-inventory-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                            Ingresar Cotización
                        </h2>
                        <button onClick={handleClose} className="btn-icon">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            {/* Información del Cliente */}
                            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="inventory-form-grid">
                                    <div className="form-column">
                                        <div className="filter-group">
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
                                        <div className="filter-group">
                                            <label className="input-label">Teléfono *</label>
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, '');
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
                                    </div>
                                    <div className="form-column">
                                        <div className="filter-group">
                                            <label className="input-label">Fecha de Entrega</label>
                                            <input
                                                type="date"
                                                value={scheduledDeliveryDate}
                                                onChange={(e) => setScheduledDeliveryDate(e.target.value)}
                                                className="input-field"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detalle de Items */}
                            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
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

                                {/* Campo de Adelanto Global */}
                                <div style={{
                                    marginBottom: '1.5rem',
                                    padding: '1rem',
                                    background: 'white',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    flexWrap: 'wrap'
                                }}>
                                    <div className="filter-group" style={{ margin: 0, minWidth: '200px' }}>
                                        <label className="input-label" style={{ fontWeight: '700', color: 'var(--success-color)' }}>ADALANTO DEL PEDIDO (S/)</label>
                                        <input
                                            type="number"
                                            value={advancePayment}
                                            onChange={(e) => setAdvancePayment(e.target.value)}
                                            className="input-field"
                                            min="0"
                                            step="0.01"
                                            style={{ borderColor: 'var(--success-color)', fontSize: '1.1rem', fontWeight: '700' }}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flex: 1 }}>
                                        El monto adelantado aplica para todo el pedido. Puede ser 0 o hasta el total de la suma de subtotales.
                                    </div>
                                </div>

                                <div className="items-list grid-style with-delete">
                                    {/* Header del grid para Desktop */}
                                    <div className="item-row quotation hide-on-mobile" style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: 0, padding: '0.75rem 1rem', borderBottom: '2px solid var(--border-color)', gap: '0.75rem' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Cant.</div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Descripción</div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>P. Unit (S/)</div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Subtotal (S/)</div>
                                        <div style={{ padding: '0 0.5rem' }}></div>
                                    </div>

                                    {items.map((item) => (
                                        <div key={item.id} className="item-row quotation" style={{ position: 'relative' }}>
                                            <div className="filter-group">
                                                <label className="input-label hide-on-desktop">Cant.</label>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                                    className="input-field"
                                                    min="1"
                                                    style={{ textAlign: 'center' }}
                                                />
                                            </div>

                                            {/* Campo descripción con botón lupa */}
                                            <div className="filter-group">
                                                <label className="input-label hide-on-desktop">Descripción</label>
                                                <div style={{ position: 'relative', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                    <input
                                                        type="text"
                                                        value={item.product}
                                                        onChange={(e) => handleItemChange(item.id, 'product', e.target.value)}
                                                        className="input-field"
                                                        placeholder="Ej. Taza personalizada, Camisa..."
                                                        style={{ flex: 1, paddingRight: item.inventoryItemNumber ? '0.75rem' : '0.75rem' }}
                                                    />
                                                    {/* Botón lupa para abrir el picker de inventario */}
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
                                                            padding: '0.55rem'
                                                        }}
                                                    >
                                                        <Search size={15} />
                                                    </button>
                                                </div>
                                                {/* Badge del item de inventario vinculado */}
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

                                            <div className="filter-group">
                                                <label className="input-label hide-on-desktop">P. Unit. (S/)</label>
                                                <input
                                                    type="number"
                                                    value={item.unitPrice}
                                                    onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
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
                                                    {calculateItemTotal(item).toFixed(2)}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="btn-icon"
                                                style={{
                                                    color: 'var(--danger-color)',
                                                    background: 'transparent',
                                                    padding: '0.5rem'
                                                }}
                                            >
                                                <Trash2 size={20} />
                                            </button>
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
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            MONTO TOTAL
                                        </p>
                                        <p style={{ margin: '0.2rem 0 0', fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                                            S/ {calculateTotal().toFixed(2)}
                                        </p>
                                    </div>
                                    <div style={{ flex: 1, minWidth: '150px' }}>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--success-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            ADELANTADO
                                        </p>
                                        <p style={{ margin: '0.2rem 0 0', fontSize: '1.5rem', fontWeight: '800', color: 'var(--success-color)' }}>
                                            S/ {calculateTotalAdvance().toFixed(2)}
                                        </p>
                                    </div>
                                    <div style={{ flex: 1, minWidth: '150px' }}>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
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
                            <button type="button" onClick={handleClose} className="btn btn-secondary">
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isLoading}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="spinner" style={{ width: '18px', height: '18px' }}></div>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        Guardar Cotización
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Picker de inventario (se monta encima del modal de cotización) */}
            {pickerForItemId && (
                <InventoryPickerModal
                    onClose={() => setPickerForItemId(null)}
                    onSelect={handleInventorySelect}
                />
            )}

            {/* Alert Dialog - reemplaza window.alert() */}
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
