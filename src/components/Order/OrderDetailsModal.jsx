import React, { useEffect, useState } from 'react';
import { X, CheckCircle, Truck, CreditCard, Play, Edit2, Save, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { OrderService } from '../../services';
import { QuotationService } from '../../services/QuotationService';
import { InventoryService } from '../../services/InventoryService';
import { useToast } from '../../context/ToastContext';
import { FileText } from 'lucide-react';

export const OrderDetailsModal = ({ order, onClose, onUpdate }) => {
    const { showToast } = useToast();
    const [currentOrder, setCurrentOrder] = useState(order);
    const [isSaving, setIsSaving] = useState(false);
    const [refQuotationNumber, setRefQuotationNumber] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedOrder, setEditedOrder] = useState(null);

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
    const canEdit = (currentOrder.status === 'En Proceso' || currentOrder.status === 'Terminado') && !isClosed;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={onClose}>
            <div className="glass-panel" style={{ width: '95%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', position: 'relative' }} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="btn-icon" style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                    <X size={24} />
                </button>

                <header style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem', paddingRight: '3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <h2 style={{ margin: 0 }}>Pedido {currentOrder.orderNumber}</h2>
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
                                <p style={{ color: 'var(--text-muted)', margin: 0 }}>{currentOrder.date} • {currentOrder.customerName}</p>
                            )}
                        </div>
                        <div style={{ padding: '0.5rem 1rem', borderRadius: '20px', background: isClosed ? 'var(--success-color)' : 'var(--primary-color)', fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {isClosed ? 'Cerrado y Pagado' : currentOrder.status}
                        </div>
                    </div>
                </header>

                {/* Workflow Actions / Edit Footer Replacement */}
                {!isClosed && (
                    <div style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', border: '1px solid var(--border-color)' }}>
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
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleStatusChange('status', 'En Proceso')}
                                    >
                                        <Play size={18} /> Iniciar Proceso
                                    </button>
                                )}

                                {currentOrder.status === 'En Proceso' && (
                                    <button
                                        className="btn btn-success"
                                        style={{ backgroundColor: 'var(--success-color)', color: 'white' }}
                                        onClick={() => handleStatusChange('status', 'Terminado')}
                                    >
                                        <CheckCircle size={18} /> Terminar Proceso
                                    </button>
                                )}

                                {currentOrder.status === 'Terminado' && (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: currentOrder.isDelivered ? 'var(--success-bg)' : 'transparent', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
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

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: currentOrder.isPaid ? 'var(--success-bg)' : 'transparent', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
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

                                {canEdit && (
                                    <button
                                        className="btn btn-outline"
                                        onClick={handleStartEdit}
                                        style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <Edit2 size={18} /> Editar Pedido
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}

                <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <div>
                        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Items</h3>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {(isEditing ? editedOrder.items : currentOrder.items).map((item) => (
                                <li key={item.id} style={{ padding: '1rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                                    {/* Layout 2 columnas: imagen (izq) + datos (der) */}
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                        {/* Imagen del item de inventario */}
                                        {item.inventoryItem && (
                                            <div style={{ flexShrink: 0, textAlign: 'center' }}>
                                                <div style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    borderRadius: '10px',
                                                    overflow: 'hidden',
                                                    border: '1px solid var(--border-color)',
                                                    background: 'var(--bg-tertiary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    {item.inventoryItem.imageUrl ? (
                                                        <img
                                                            src={item.inventoryItem.imageUrl}
                                                            alt={item.inventoryItem.tipo || item.inventoryItem.itemNumber}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <ImageIcon size={22} strokeWidth={1.2} color="var(--text-muted)" />
                                                    )}
                                                </div>
                                                <div style={{
                                                    marginTop: '0.3rem',
                                                    padding: '0.15rem 0.35rem',
                                                    background: 'var(--primary-light)',
                                                    border: '1px solid var(--primary-color)',
                                                    borderRadius: '4px',
                                                    fontSize: '0.65rem',
                                                    color: 'var(--primary-color)',
                                                    fontWeight: '700'
                                                }}>
                                                    {item.inventoryItem.itemNumber}
                                                </div>
                                            </div>
                                        )}

                                        {/* Datos del item */}
                                        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1 }}>
                                                {isEditing ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                        <input
                                                            type="number"
                                                            className="input-field"
                                                            style={{ width: '60px', padding: '0.2rem' }}
                                                            value={item.quantity}
                                                            onChange={(e) => handleEditItem(item.id, 'quantity', e.target.value)}
                                                        />
                                                        <span style={{ fontWeight: 'bold' }}>x {item.description}</span>
                                                    </div>
                                                ) : (
                                                    <div style={{ fontWeight: 'bold' }}>{item.quantity} x {item.description}</div>
                                                )}

                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    P. Unit:
                                                    {isEditing ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                            S/ <input
                                                                type="number"
                                                                className="input-field"
                                                                style={{ width: '80px', padding: '0.2rem' }}
                                                                value={item.unitPrice}
                                                                onChange={(e) => handleEditItem(item.id, 'unitPrice', e.target.value)}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span>S/ {item.unitPrice.toFixed(2)}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right', minWidth: '100px' }}>
                                                <div style={{ color: 'var(--primary-color)', fontWeight: '700', fontSize: '1.1rem' }}>
                                                    S/ {(Number(item.quantity) * Number(item.unitPrice)).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div style={{ background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: '12px', height: 'fit-content', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ marginTop: 0 }}>Resumen Financiero</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ fontWeight: '500' }}>Total Importe:</span>
                            <span style={{ fontWeight: '600' }}>S/ {(isEditing ? editedOrder.totalAmount : currentOrder.totalAmount).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                            <span style={{ fontWeight: '500' }}>Total Adelanto:</span>
                            {isEditing ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                    S/ <input
                                        type="number"
                                        className="input-field"
                                        style={{ width: '100px', padding: '0.4rem', textAlign: 'right' }}
                                        value={editedOrder.totalAdvance}
                                        onChange={(e) => handleEditHeader('totalAdvance', e.target.value)}
                                        min="0.01"
                                        step="0.01"
                                    />
                                </div>
                            ) : (
                                <span style={{ fontWeight: '600' }}>S/ {currentOrder.totalAdvance.toFixed(2)}</span>
                            )}
                        </div>
                        <div style={{ borderTop: '1px solid var(--border-color)', margin: '1rem 0' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                            <span>Saldo a Favor:</span>
                            <span>S/ {(isEditing ? editedOrder.totalBalance : currentOrder.totalBalance).toFixed(2)}</span>
                        </div>
                        <div style={{ marginTop: '2rem' }}>
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

                        <div style={{ marginTop: '1.5rem' }}>
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

            {isSaving && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <div className="loading-text">Actualizando...</div>
                </div>
            )}
        </div>
    );
};
