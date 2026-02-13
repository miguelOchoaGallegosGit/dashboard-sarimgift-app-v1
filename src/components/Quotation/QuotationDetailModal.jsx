import React, { useState, useEffect } from 'react';
import { X, Save, Ban, CheckCircle, XCircle, ShoppingBag } from 'lucide-react';
import { QuotationService } from '../../services/QuotationService';
import { ConfirmActionModal } from './ConfirmActionModal';
import { RejectQuotationModal } from './RejectQuotationModal';
import { useToast } from '../../context/ToastContext';

export const QuotationDetailModal = ({ quotation, onClose, onUpdate }) => {
    const { showToast } = useToast();
    const [items, setItems] = useState(quotation.items || []);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [showConfirmClose, setShowConfirmClose] = useState(false);
    const [showConfirmProcess, setShowConfirmProcess] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [linkedOrderNumber, setLinkedOrderNumber] = useState(null);

    // Cerrar con ESC
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && !isProcessing && !isLoading && !isRejecting) {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isProcessing, isLoading, isRejecting, hasChanges]);

    // Cargar nro de pedido vinculado si existe
    useEffect(() => {
        const fetchLinkedOrder = async () => {
            if (quotation.relatedOrderId) {
                try {
                    const { data, error } = await QuotationService.supabase
                        .from('orders')
                        .select('order_number')
                        .eq('id', quotation.relatedOrderId)
                        .single();

                    if (data) setLinkedOrderNumber(data.order_number);
                } catch (error) {
                    console.error('Error fetching linked order:', error);
                }
            }
        };
        fetchLinkedOrder();
    }, [quotation.relatedOrderId]);

    // Status Logic
    const isEditable = quotation.status === 'REGISTRADO';

    const handleItemChange = (itemId, field, value) => {
        if (!isEditable) return;
        setHasChanges(true); // Marcar que hay cambios
        setItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId
                    ? {
                        ...item,
                        [field]: value,
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
            const updatePromises = items.map(async (item) => {
                const originalItem = quotation.items.find(o => o.id === item.id);
                if (!originalItem) return null;

                const hasChanged =
                    originalItem.quantity !== item.quantity ||
                    originalItem.unitPrice !== item.unitPrice ||
                    originalItem.advancePayment !== item.advancePayment ||
                    originalItem.shippingCost !== item.shippingCost;

                if (hasChanged) {
                    return await QuotationService.updateQuotationItem(item.id, {
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        advancePayment: item.advancePayment,
                        shippingCost: item.shippingCost
                    });
                }
                return null;
            });

            await Promise.all(updatePromises);

            const updatedQuotation = await QuotationService.getQuotationById(quotation.id);
            setHasChanges(false);
            showToast('✅ Cambios guardados correctamente');
            onUpdate(updatedQuotation);
            onClose();
        } catch (error) {
            console.error('Error saving changes:', error);
            showToast('❌ Error al guardar los cambios: ' + error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleProcessOrder = async () => {
        setIsProcessing(true);
        try {
            const updatedQuotation = await QuotationService.processQuotationToOrder(quotation.id);
            showToast(`✅ Orden procesada correctamente: ${updatedQuotation.quotationNumber}`);
            onUpdate(updatedQuotation);
            onClose();
        } catch (error) {
            console.error('Error processing order:', error);
            showToast('❌ Error al procesar la orden: ' + error.message, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async (rejectionReason) => {
        setIsRejecting(true);
        try {
            const updatedQuotation = await QuotationService.rejectQuotation(quotation.id, rejectionReason);
            showToast('⚠️ Cotización rechazada correctamente', 'warning');
            onUpdate(updatedQuotation);
            onClose();
        } catch (error) {
            console.error('Error rejecting quotation:', error);
            showToast('❌ Error al rechazar la cotización: ' + error.message, 'error');
        } finally {
            setIsRejecting(false);
        }
    };

    const handleClose = () => {
        if (hasChanges) {
            setShowConfirmClose(true);
        } else {
            onClose();
        }
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice) + (parseFloat(item.shippingCost) || 0), 0);
    };

    const calculateTotalAdvance = () => {
        return items.reduce((sum, item) => sum + (parseFloat(item.advancePayment) || 0), 0);
    };

    const calculateBalance = () => {
        return calculateTotal() - calculateTotalAdvance();
    };

    const formatDate = (dateString, showTime = false) => {
        if (!dateString) return 'No especificada';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;

            const options = {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            };

            if (showTime) {
                options.hour = '2-digit';
                options.minute = '2-digit';
            }

            return date.toLocaleDateString('es-PE', options);
        } catch (e) {
            return dateString;
        }
    };

    return (
        <>
            <div className="modal-overlay" onClick={handleClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '950px' }}>
                    <div className="modal-header">
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                                    Detalle de Cotización
                                </h2>
                                {hasChanges && (
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        backgroundColor: '#fff3e0',
                                        color: '#ef6c00',
                                        border: '1px solid #ffb74d',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                    }}>
                                        <span style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            backgroundColor: '#ef6c00',
                                            animation: 'pulse 1.5s ease-in-out infinite'
                                        }}></span>
                                        Cambios sin guardar
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    {quotation.quotationNumber}
                                </p>
                                <span className={`status-badge status-${quotation.status.toLowerCase()}`}
                                    style={{
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        fontWeight: '600',
                                        backgroundColor: quotation.status === 'REGISTRADO' ? '#e3f2fd' :
                                            quotation.status === 'ACEPTADO' ? '#e8f5e9' : '#ffebee',
                                        color: quotation.status === 'REGISTRADO' ? '#1976d2' :
                                            quotation.status === 'ACEPTADO' ? '#2e7d32' : '#c62828'
                                    }}>
                                    {quotation.status}
                                </span>
                                {linkedOrderNumber && (
                                    <span style={{
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        fontWeight: '600',
                                        backgroundColor: '#f3e5f5',
                                        color: '#7b1fa2',
                                        border: '1px solid #ce93d8',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem'
                                    }}>
                                        <ShoppingBag size={14} />
                                        Pedido: {linkedOrderNumber}
                                    </span>
                                )}
                                {quotation.status === 'RECHAZADO' && quotation.rejectionReason && (
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        backgroundColor: '#fff3e0',
                                        color: '#e65100',
                                        border: '1px solid #ffb74d',
                                        fontStyle: 'italic',
                                        maxWidth: '300px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }} title={quotation.rejectionReason}>
                                        Motivo: {quotation.rejectionReason}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button onClick={handleClose} className="modal-close">
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
                                    <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cliente</span>
                                    <strong style={{ fontSize: '1.1rem' }}>{quotation.customerName}</strong>
                                </div>
                                <div>
                                    <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Teléfono</span>
                                    <strong style={{ fontSize: '1.1rem' }}>{quotation.phone}</strong>
                                </div>
                                <div>
                                    <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fecha Registro</span>
                                    <strong style={{ fontSize: '1.1rem' }}>{formatDate(quotation.registrationDate || quotation.createdAt)}</strong>
                                </div>
                                <div>
                                    <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fecha Programada</span>
                                    <strong style={{ fontSize: '1.1rem' }}>{formatDate(quotation.scheduledDeliveryDate)}</strong>
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Productos
                            </h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="data-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'center', width: '70px' }}>Cant.</th>
                                            <th style={{ minWidth: '200px' }}>Descripción</th>
                                            <th style={{ textAlign: 'right', width: '120px' }}>Precio Unit.</th>
                                            <th style={{ textAlign: 'right', width: '120px' }}>Adelanto</th>
                                            <th style={{ textAlign: 'right', width: '120px' }}>Costo Entrega</th>
                                            <th style={{ textAlign: 'right', width: '120px' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item) => (
                                            <tr key={item.id}>
                                                <td style={{ textAlign: 'center' }}>
                                                    {isEditable ? (
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                                            className="input-field"
                                                            min="1"
                                                            style={{ width: '100%', textAlign: 'center', padding: '0.3rem' }}
                                                        />
                                                    ) : item.quantity}
                                                </td>
                                                <td style={{ fontWeight: '600' }}>{item.product}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    {isEditable ? (
                                                        <input
                                                            type="number"
                                                            value={item.unitPrice}
                                                            onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                            className="input-field"
                                                            min="0"
                                                            step="0.01"
                                                            style={{ width: '100%', textAlign: 'right', padding: '0.3rem' }}
                                                        />
                                                    ) : `S/ ${item.unitPrice.toFixed(2)}`}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    {isEditable ? (
                                                        <input
                                                            type="number"
                                                            value={item.advancePayment}
                                                            onChange={(e) => handleItemChange(item.id, 'advancePayment', parseFloat(e.target.value) || 0)}
                                                            className="input-field"
                                                            min="0"
                                                            step="0.01"
                                                            style={{ width: '100%', textAlign: 'right', padding: '0.3rem' }}
                                                        />
                                                    ) : `S/ ${item.advancePayment.toFixed(2)}`}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    {isEditable ? (
                                                        <input
                                                            type="number"
                                                            value={item.shippingCost}
                                                            onChange={(e) => handleItemChange(item.id, 'shippingCost', parseFloat(e.target.value) || 0)}
                                                            className="input-field"
                                                            min="0"
                                                            step="0.01"
                                                            style={{ width: '100%', textAlign: 'right', padding: '0.3rem' }}
                                                        />
                                                    ) : `S/ ${item.shippingCost.toFixed(2)}`}
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--primary-color)' }}>
                                                    S/ {((item.quantity * item.unitPrice) + (item.shippingCost || 0)).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totales */}
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
                                        TOTAL
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
                                        SALDO
                                    </p>
                                    <p style={{ margin: '0.2rem 0 0', fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                                        S/ {calculateBalance().toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={handleClose} className="btn btn-secondary">
                                Cerrar
                            </button>

                            {isEditable && (
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    disabled={isRejecting}
                                    className="btn"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        backgroundColor: '#c62828',
                                        color: 'white',
                                        border: 'none'
                                    }}
                                >
                                    {isRejecting ? <div className="spinner modal-spinner"></div> : <XCircle size={18} />}
                                    Rechazar
                                </button>
                            )}
                        </div>

                        {isEditable && (
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={handleSaveChanges}
                                    className="btn btn-primary"
                                    disabled={isLoading || !hasChanges}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        opacity: !hasChanges ? 0.6 : 1,
                                        cursor: !hasChanges ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {isLoading ? <div className="spinner modal-spinner"></div> : <Save size={18} />}
                                    Guardar Cambios
                                </button>
                                <button
                                    onClick={() => setShowConfirmProcess(true)}
                                    className="btn btn-success"
                                    disabled={isProcessing}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--success-color)', color: 'white' }}
                                >
                                    {isProcessing ? <div className="spinner modal-spinner"></div> : <CheckCircle size={18} />}
                                    Procesar Orden
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de confirmación para cerrar sin guardar */}
            <ConfirmActionModal
                isOpen={showConfirmClose}
                onClose={() => setShowConfirmClose(false)}
                onConfirm={() => {
                    setShowConfirmClose(false);
                    onClose();
                }}
                type="warning"
                title="¿Cerrar sin guardar?"
                message="Tienes cambios sin guardar que se perderán si cierras ahora. ¿Estás seguro de que deseas continuar?"
                confirmText="Sí, cerrar"
                cancelText="No, volver"
            />

            {/* Modal de confirmación para procesar orden */}
            <ConfirmActionModal
                isOpen={showConfirmProcess}
                onClose={() => setShowConfirmProcess(false)}
                onConfirm={handleProcessOrder}
                type="success"
                title="¿Procesar esta cotización?"
                message="Esto convertirá la cotización en una orden y cambiará su estado a ACEPTADO. Esta acción es definitiva."
                confirmText="Sí, procesar"
                cancelText="Cancelar"
            />

            {/* Modal de rechazo con motivo */}
            <RejectQuotationModal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                onConfirm={handleReject}
                quotationNumber={quotation.quotationNumber}
            />
        </>
    );
};
