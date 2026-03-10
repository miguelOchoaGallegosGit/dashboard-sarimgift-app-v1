import React, { useEffect, useState } from 'react';
import { X, CheckCircle, Truck, CreditCard, Play, Edit2, Save, RotateCcw, Image as ImageIcon, Trash2, Plus, Search, FileText } from 'lucide-react';
import { OrderService } from '../../services';
import { QuotationService } from '../../services/QuotationService';
import { InventoryService } from '../../services/InventoryService';
import { useToast } from '../../context/ToastContext';
import { InventoryPickerModal } from '../Inventory/InventoryPickerModal';

export const OrderDetailsModal = ({ order, onClose, onUpdate }) => {
    const { showToast } = useToast();
    const [currentOrder, setCurrentOrder] = useState(order);
    const [isSaving, setIsSaving] = useState(false);
    const [refQuotationNumber, setRefQuotationNumber] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedOrder, setEditedOrder] = useState(null);
    const [pickerForItemId, setPickerForItemId] = useState(null);

    useEffect(() => {
        setCurrentOrder(order);
    }, [order]);

    // Cargar cotización de referencia
    useEffect(() => {
        const fetchRefQuotation = async () => {
            if (currentOrder.id) {
                const data = await QuotationService.getQuotationByOrderId(currentOrder.id);
                if (data) setRefQuotationNumber(data.quotation_number);
            }
        };
        fetchRefQuotation();
    }, [currentOrder.id]);

    // Cerrar modal con tecla ESC
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscKey);
        return () => document.removeEventListener('keydown', handleEscKey);
    }, [onClose]);

    if (!currentOrder) return null;

    const handleStatusChange = async (key, value) => {
        if (isEditing) return; // No permitir cambios de estado mientras se edita
        setIsSaving(true);
        try {
            // Manejo de transiciones de estado explícitas
            if (key === 'status') {
                const updated = await OrderService.updateOrder(currentOrder.id, { status: value });
                setCurrentOrder(updated);
                onUpdate(updated);
                setIsSaving(false);
                const message = value === 'En Proceso' ? '🚀 Proceso iniciado' : '✅ Proceso terminado';
                showToast(message);
                return;
            }

            // Si se marca como entregado (y antes no lo estaba), descontar stock del inventario
            if (key === 'isDelivered' && value === true && !currentOrder.isDelivered) {
                const itemsWithInventory = currentOrder.items.filter(item => item.inventoryItemId);
                if (itemsWithInventory.length > 0) {
                    await Promise.allSettled(
                        itemsWithInventory.map(item =>
                            InventoryService.deductInventoryStock(item.inventoryItemId, item.quantity)
                        )
                    );
                    showToast('📦 Stock de inventario actualizado');
                }
            }

            // If we are toggling flags
            const updates = { [key]: value };
            const updated = await OrderService.updateOrder(currentOrder.id, updates);
            setCurrentOrder(updated);
            onUpdate(updated);

            if (updated.status === 'Cerrado' || updated.status === 'Cerrado y Pagado') {
                showToast('🎉 Pedido cerrado y pagado correctamente');
            } else {
                showToast('✅ Estado actualizado correctamente');
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            showToast('❌ Error al actualizar el estado: ' + error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleStartEdit = () => {
        setEditedOrder({
            ...currentOrder,
            items: currentOrder.items.map(item => ({ ...item }))
        });
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedOrder(null);
    };

    const handleSaveEdit = async () => {
        if (!editedOrder.customerName.trim()) {
            showToast('⚠️ El nombre del cliente es obligatorio', 'warning');
            return;
        }

        // Validar que todos los items tengan descripción
        const emptyItems = editedOrder.items.filter(item => !item.description || !item.description.trim());
        if (emptyItems.length > 0) {
            showToast('⚠️ Todos los items deben tener una descripción', 'warning');
            return;
        }

        if (Number(editedOrder.totalAdvance) < 0) {
            showToast('⚠️ El adelanto no puede ser negativo', 'warning');
            return;
        }

        const totalAmount = editedOrder.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
        if (Number(editedOrder.totalAdvance) > totalAmount) {
            showToast('⚠️ El adelanto no puede superar el monto total (S/ ' + totalAmount.toFixed(2) + ')', 'warning');
            return;
        }

        setIsSaving(true);
        try {
            const updated = await OrderService.updateOrder(currentOrder.id, {
                customerName: editedOrder.customerName,
                totalAdvance: Number(editedOrder.totalAdvance),
                deliveryDate: editedOrder.deliveryDate,
                notes: editedOrder.notes,
                items: editedOrder.items.map(item => ({
                    ...item,
                    amount: Number(item.quantity) * Number(item.unitPrice)
                }))
            });
            setCurrentOrder(updated);
            onUpdate(updated);
            setIsEditing(false);
            setEditedOrder(null);
            showToast('✅ Pedido actualizado correctamente');
        } catch (error) {
            console.error('Error saving order changes:', error);
            showToast('❌ Error al guardar cambios: ' + error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditItem = (itemId, field, value) => {
        setEditedOrder(prev => {
            const newItems = prev.items.map(item => {
                if (item.id === itemId) {
                    const updatedItem = { ...item, [field]: value };
                    updatedItem.amount = Number(updatedItem.quantity) * Number(updatedItem.unitPrice);
                    return updatedItem;
                }
                return item;
            });

            const newTotalAmount = newItems.reduce((sum, item) => sum + item.amount, 0);

            return {
                ...prev,
                items: newItems,
                totalAmount: newTotalAmount,
                totalBalance: newTotalAmount - (Number(prev.totalAdvance) || 0)
            };
        });
    };

    const handleAddItem = () => {
        setEditedOrder(prev => {
            const newItem = {
                id: `new-${Date.now()}`,
                description: '',
                quantity: 1,
                unitPrice: 0,
                amount: 0,
                inventoryItemId: null,
                inventoryItem: null
            };
            return { ...prev, items: [...prev.items, newItem] };
        });
    };

    const handleRemoveItem = (itemId) => {
        setEditedOrder(prev => {
            if (prev.items.length <= 1) {
                showToast('⚠️ El pedido debe tener al menos un item', 'warning');
                return prev;
            }
            const newItems = prev.items.filter(item => item.id !== itemId);
            const newTotalAmount = newItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
            return {
                ...prev,
                items: newItems,
                totalAmount: newTotalAmount,
                totalBalance: newTotalAmount - (Number(prev.totalAdvance) || 0)
            };
        });
    };

    // Selección desde el picker de inventario (solo para items nuevos)
    const handleInventorySelect = (inventoryItem) => {
        if (!pickerForItemId) return;

        const parts = [inventoryItem.tipo, inventoryItem.material, inventoryItem.modelo, inventoryItem.size, inventoryItem.color]
            .filter(Boolean);
        const description = parts.length > 0 ? parts.join(' - ') : inventoryItem.itemNumber;

        setEditedOrder(prev => {
            const newItems = prev.items.map(item => {
                if (item.id !== pickerForItemId) return item;
                const qty = Math.min(Number(item.quantity) || 1, inventoryItem.quantity);
                return {
                    ...item,
                    description,
                    unitPrice: inventoryItem.unit_price,
                    amount: qty * inventoryItem.unit_price,
                    quantity: qty,
                    inventoryItemId: inventoryItem.id,
                    inventoryItem: inventoryItem
                };
            });
            const newTotalAmount = newItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
            return {
                ...prev,
                items: newItems,
                totalAmount: newTotalAmount,
                totalBalance: newTotalAmount - (Number(prev.totalAdvance) || 0)
            };
        });
        setPickerForItemId(null);
    };

    const handleEditHeader = (field, value) => {
        setEditedOrder(prev => {
            const updates = { [field]: value };
            if (field === 'totalAdvance') {
                updates.totalBalance = (Number(prev.totalAmount) || 0) - (Number(value) || 0);
            }
            return { ...prev, ...updates };
        });
    };

    const isClosed = currentOrder.status === 'Cerrado' || currentOrder.status === 'Cerrado y Pagado';
    const canEdit = (currentOrder.status === 'Recibido' || currentOrder.status === 'En Proceso' || currentOrder.status === 'Terminado') && !isClosed && !currentOrder.isDelivered && !currentOrder.isPaid;

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content add-inventory-modal" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="modal-header" style={{ paddingRight: '3rem' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)' }}>Pedido {currentOrder.orderNumber}</h2>
                                {refQuotationNumber && (
                                    <span style={{
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        backgroundColor: '#e3f2fd',
                                        color: '#1565c0',
                                        border: '1px solid #90caf9',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem'
                                    }}>
                                        <FileText size={14} />
                                        Ref: {refQuotationNumber}
                                    </span>
                                )}
                                <span style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', background: isClosed ? 'var(--success-color)' : 'var(--primary-color)', fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                    {isClosed ? 'Cerrado y Pagado' : currentOrder.status}
                                </span>
                            </div>
                            {isEditing ? (
                                <input
                                    type="text"
                                    className="input-field"
                                    style={{ marginTop: '0.5rem', maxWidth: '300px' }}
                                    value={editedOrder.customerName}
                                    onChange={(e) => handleEditHeader('customerName', e.target.value)}
                                    placeholder="Nombre del cliente"
                                />
                            ) : (
                                <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>{currentOrder.date} • {currentOrder.customerName}</p>
                            )}
                        </div>
                        <button onClick={onClose} className="btn-icon">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="modal-body">
                        {/* Workflow Actions / Edit Controls */}
                        {!isClosed && (
                            <div style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', border: '1px solid var(--border-color)' }}>
                                {isEditing ? (
                                    <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-end' }}>
                                        <button className="btn btn-secondary" onClick={handleCancelEdit}>
                                            <RotateCcw size={18} /> Cancelar
                                        </button>
                                        <button className="btn btn-primary" onClick={handleSaveEdit}>
                                            <Save size={18} /> Guardar Cambios
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {currentOrder.status === 'Recibido' && (
                                            <button className="btn btn-primary" onClick={() => handleStatusChange('status', 'En Proceso')}>
                                                <Play size={18} /> Iniciar Proceso
                                            </button>
                                        )}

                                        {currentOrder.status === 'En Proceso' && (
                                            <button className="btn btn-success" style={{ backgroundColor: 'var(--success-color)', color: 'white' }} onClick={() => handleStatusChange('status', 'Terminado')}>
                                                <CheckCircle size={18} /> Terminar Proceso
                                            </button>
                                        )}

                                        {currentOrder.status === 'Terminado' && (
                                            <>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: currentOrder.isDelivered ? 'var(--success-bg)' : 'transparent', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                                    <input type="checkbox" id="chk-delivered" checked={currentOrder.isDelivered} onChange={(e) => handleStatusChange('isDelivered', e.target.checked)} style={{ transform: 'scale(1.5)', accentColor: 'var(--success-color)' }} />
                                                    <label htmlFor="chk-delivered" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <Truck size={18} /> Entregado
                                                    </label>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: currentOrder.isPaid ? 'var(--success-bg)' : 'transparent', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                                    <input type="checkbox" id="chk-paid" checked={currentOrder.isPaid} onChange={(e) => handleStatusChange('isPaid', e.target.checked)} style={{ transform: 'scale(1.5)', accentColor: 'var(--success-color)' }} />
                                                    <label htmlFor="chk-paid" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <CreditCard size={18} /> Pagado
                                                    </label>
                                                </div>
                                            </>
                                        )}

                                        {canEdit && (
                                            <button className="btn btn-outline" onClick={handleStartEdit} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Edit2 size={18} /> Editar Pedido
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Items Section - Full Width */}
                        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>Items</h3>
                                {isEditing && (
                                    <button className="btn btn-primary" onClick={handleAddItem} style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Plus size={16} /> Agregar Item
                                    </button>
                                )}
                            </div>

                            {/* Adelanto editable */}
                            {isEditing && (
                                <div style={{
                                    marginBottom: '1.5rem', padding: '1rem', background: 'white', borderRadius: '12px',
                                    border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'
                                }}>
                                    <div className="filter-group" style={{ margin: 0, minWidth: '200px' }}>
                                        <label className="input-label" style={{ fontWeight: '700', color: 'var(--success-color)' }}>ADELANTO (S/)</label>
                                        <input
                                            type="number"
                                            value={editedOrder.totalAdvance}
                                            onChange={(e) => handleEditHeader('totalAdvance', e.target.value)}
                                            className="input-field"
                                            min="0" step="0.01"
                                            style={{ borderColor: 'var(--success-color)', fontSize: '1.1rem', fontWeight: '700' }}
                                        />
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flex: 1 }}>
                                        El monto adelantado aplica para todo el pedido.
                                    </div>
                                </div>
                            )}

                            {/* Items Grid Header (desktop) */}
                            <div className="items-list grid-style with-delete">
                                <div className="item-row quotation hide-on-mobile" style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: 0, padding: '0.75rem 1rem', borderBottom: '2px solid var(--border-color)', gap: '0.75rem' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Cant.</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Descripción</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>P. Unit (S/)</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Total (S/)</div>
                                    <div style={{ padding: '0 0.5rem' }}></div>
                                </div>

                                {(isEditing ? editedOrder.items : currentOrder.items).map((item) => (
                                    <div key={item.id} className="item-row quotation" style={{ position: 'relative' }}>
                                        {/* Cantidad */}
                                        <div className="filter-group">
                                            <label className="input-label hide-on-desktop">Cant.</label>
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleEditItem(item.id, 'quantity', e.target.value)}
                                                    className="input-field"
                                                    min="1"
                                                    style={{ textAlign: 'center' }}
                                                />
                                            ) : (
                                                <div className="input-field" style={{ background: 'var(--bg-tertiary)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {item.quantity}
                                                </div>
                                            )}
                                        </div>

                                        {/* Descripción + lupa para items nuevos */}
                                        <div className="filter-group">
                                            <label className="input-label hide-on-desktop">Descripción</label>
                                            {isEditing ? (
                                                <>
                                                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                        <input
                                                            type="text"
                                                            className="input-field"
                                                            value={item.description}
                                                            onChange={(e) => handleEditItem(item.id, 'description', e.target.value)}
                                                            placeholder="Descripción del item"
                                                            style={{ flex: 1, fontWeight: '600' }}
                                                        />
                                                        {/* Lupa solo para items nuevos (sin inventoryItem ya vinculado) */}
                                                        {!item.inventoryItem && (
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
                                                        )}
                                                    </div>
                                                    {/* Badge del item de inventario vinculado */}
                                                    {item.inventoryItem && (
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
                                                            📦 {item.inventoryItem.itemNumber}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="input-field" style={{ background: 'var(--bg-tertiary)', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                                                    {item.description}
                                                </div>
                                            )}
                                        </div>

                                        {/* Precio unitario */}
                                        <div className="filter-group">
                                            <label className="input-label hide-on-desktop">P. Unit. (S/)</label>
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    value={item.unitPrice}
                                                    onChange={(e) => handleEditItem(item.id, 'unitPrice', e.target.value)}
                                                    className="input-field"
                                                    min="0" step="0.01"
                                                    style={{ textAlign: 'right' }}
                                                />
                                            ) : (
                                                <div className="input-field" style={{ background: 'var(--bg-tertiary)', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                    {Number(item.unitPrice).toFixed(2)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Total */}
                                        <div className="filter-group">
                                            <label className="input-label hide-on-desktop">Total (S/)</label>
                                            <div style={{
                                                height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                fontWeight: '700', fontSize: '1rem', color: 'var(--primary-color)',
                                                background: 'var(--bg-tertiary)', padding: '0 1rem', borderRadius: '8px',
                                                border: '1px solid var(--border-color)'
                                            }}>
                                                <span>{(Number(item.quantity) * Number(item.unitPrice)).toFixed(2)}</span>
                                                {isEditing && (
                                                    <button
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="btn-icon"
                                                        title="Eliminar item"
                                                        style={{ color: '#c62828', padding: '0.3rem', borderRadius: '6px', border: '1px solid #ffcdd2', background: '#ffebee', marginLeft: '0.5rem' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Resumen Financiero - Bottom */}
                        <div style={{
                            padding: '1.5rem', background: 'var(--bg-tertiary)', borderRadius: '12px',
                            border: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem'
                        }}>
                            <div style={{ flex: 1, minWidth: '150px' }}>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>TOTAL</p>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                                    S/ {(isEditing ? editedOrder.totalAmount : currentOrder.totalAmount).toFixed(2)}
                                </p>
                            </div>
                            <div style={{ flex: 1, minWidth: '150px' }}>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--success-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>ADELANTADO</p>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '1.5rem', fontWeight: '800', color: 'var(--success-color)' }}>
                                    S/ {(isEditing ? Number(editedOrder.totalAdvance) : currentOrder.totalAdvance).toFixed(2)}
                                </p>
                            </div>
                            <div style={{ flex: 1, minWidth: '150px' }}>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>SALDO</p>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-color)' }}>
                                    S/ {(isEditing ? editedOrder.totalBalance : currentOrder.totalBalance).toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {/* Fecha Entrega y Notas */}
                        <div className="glass-panel" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Fecha Entrega:</div>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={editedOrder.deliveryDate ? editedOrder.deliveryDate.split('T')[0] : ''}
                                        onChange={(e) => handleEditHeader('deliveryDate', e.target.value)}
                                    />
                                ) : (
                                    <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                                        {(() => {
                                            const dateVal = currentOrder.deliveryDate;
                                            if (!dateVal) return 'No especificada';
                                            try {
                                                const date = new Date(dateVal);
                                                return isNaN(date.getTime()) ? dateVal : date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                            } catch (e) { return dateVal; }
                                        })()}
                                    </div>
                                )}
                            </div>
                            <div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Notas:</div>
                                {isEditing ? (
                                    <textarea
                                        className="input-field"
                                        style={{ width: '100%', minHeight: '80px', resize: 'none', padding: '0.6rem' }}
                                        value={editedOrder.notes || ''}
                                        onChange={(e) => handleEditHeader('notes', e.target.value.substring(0, 200))}
                                        placeholder="Añadir notas del pedido..."
                                        maxLength={200}
                                    />
                                ) : (
                                    <div style={{ fontSize: '0.95rem', fontStyle: currentOrder.notes ? 'normal' : 'italic', color: currentOrder.notes ? 'var(--text-color)' : 'var(--text-muted)' }}>
                                        {currentOrder.notes || 'Sin notas adicionales'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Picker de inventario */}
            {pickerForItemId && (
                <InventoryPickerModal
                    onClose={() => setPickerForItemId(null)}
                    onSelect={handleInventorySelect}
                />
            )}

            {isSaving && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <div className="loading-text">Actualizando...</div>
                </div>
            )}
        </>
    );
};
