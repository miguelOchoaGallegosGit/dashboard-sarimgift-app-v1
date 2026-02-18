import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Ban, CheckCircle, XCircle, ShoppingBag, Send, Share2, Download, Package, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import { QuotationService } from '../../services/QuotationService';
import { ConfirmActionModal } from './ConfirmActionModal';
import { RejectQuotationModal } from './RejectQuotationModal';
import { useToast } from '../../context/ToastContext';


export const QuotationDetailModal = ({ quotation, onClose, onUpdate, autoSend = false }) => {
    const { showToast } = useToast();
    const [items, setItems] = useState(quotation.items || []);
    const [advancePayment, setAdvancePayment] = useState(quotation.advancePayment || 0);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [showConfirmClose, setShowConfirmClose] = useState(false);
    const [showConfirmProcess, setShowConfirmProcess] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [linkedOrderNumber, setLinkedOrderNumber] = useState(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const contentRef = useRef(null);
    const hasAutoSent = useRef(false);

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
            // Update items
            const updatePromises = items.map(async (item) => {
                const originalItem = quotation.items.find(o => o.id === item.id);
                if (!originalItem) return null;

                const hasChanged =
                    originalItem.quantity !== item.quantity ||
                    originalItem.unitPrice !== item.unitPrice ||
                    originalItem.shippingCost !== item.shippingCost;

                if (hasChanged) {
                    return await QuotationService.updateQuotationItem(item.id, {
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        shippingCost: item.shippingCost
                    });
                }
                return null;
            });

            await Promise.all(updatePromises);

            // Update Quotation Header (advance payment)
            if (quotation.advancePayment !== advancePayment) {
                const total = calculateTotal();
                const advance = parseFloat(advancePayment) || 0;
                if (advance > total) {
                    showToast('⚠️ El adelanto no puede superar el monto total (S/ ' + total.toFixed(2) + ')', 'warning');
                    setIsLoading(false);
                    return;
                }

                await QuotationService.updateQuotation(quotation.id, {
                    advancePayment: advance
                });
            }

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
        return parseFloat(advancePayment) || 0;
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

    // Auto-enviar si se activa desde la grilla
    useEffect(() => {
        if (autoSend && !hasAutoSent.current) {
            hasAutoSent.current = true;
            handleSendImage();
        }
    }, [autoSend]);

    const handleSendImage = async () => {
        if (!contentRef.current) return;
        setIsGeneratingImage(true);

        try {
            // Un pequeño delay para asegurar que el DOM esté listo y no se vea el botón de carga
            await new Promise(resolve => setTimeout(resolve, 300));

            const canvas = await html2canvas(contentRef.current, {
                useCORS: true,
                scale: 3, // Mayor resolución para mejor lectura
                backgroundColor: '#f8f9fa',
                logging: false,
                windowWidth: 1280, // Forzar ancho de escritorio durante la captura
                windowHeight: contentRef.current.scrollHeight,
                onclone: (clonedDoc) => {
                    // Ocultar elementos innecesarios en la imagen
                    const elementsToHide = clonedDoc.querySelectorAll('.hide-on-capture');
                    elementsToHide.forEach(el => el.style.display = 'none');

                    // Forzar modo grilla en la captura (desktop)
                    const modalContent = clonedDoc.querySelector('.modal-content');
                    if (modalContent) {
                        modalContent.classList.add('capturing-mode');
                        modalContent.style.width = '1100px';
                        modalContent.style.maxWidth = '1100px';
                        modalContent.style.padding = '3rem';
                        modalContent.style.margin = '0 auto';
                        modalContent.style.borderRadius = '0';
                        modalContent.style.boxShadow = 'none';
                    }
                }
            });

            const image = canvas.toDataURL('image/png');
            const fileName = `Cotizacion_${quotation.quotationNumber}_${quotation.customerName.replace(/\s+/g, '_')}.png`;

            // Detectar si es móvil para usar Web Share API
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            if (isMobile && navigator.share) {
                const blob = await (await fetch(image)).blob();
                const file = new File([blob], fileName, { type: 'image/png' });

                try {
                    await navigator.share({
                        files: [file],
                        title: `Cotización ${quotation.quotationNumber}`,
                        text: `Hola ${quotation.customerName}, adjunto tu cotización.`
                    });
                } catch (shareError) {
                    // Si falla el share (ej. el usuario canceló), no hacemos nada o descargamos como fallback
                }
            } else {
                // Desktop: Descarga directa
                const link = document.createElement('a');
                link.href = image;
                link.download = fileName;
                link.click();
                showToast('✅ Imagen generada y lista para enviar');
            }
        } catch (error) {
            console.error('Error generating image:', error);
            showToast('❌ Error al generar la imagen', 'error');
        } finally {
            setIsGeneratingImage(false);
        }
    };

    return (
        <>
            <div className="modal-overlay" onClick={handleClose}>
                <div className="modal-content add-inventory-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
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
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <button
                                onClick={handleSendImage}
                                className="btn btn-secondary hide-on-capture"
                                title="Enviar por WhatsApp / Descargar Imagen"
                                disabled={isGeneratingImage}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    backgroundColor: 'var(--primary-light)',
                                    color: 'var(--primary-color)',
                                    border: '1px solid var(--primary-color)',
                                    padding: '0.5rem 1rem'
                                }}
                            >
                                {isGeneratingImage ? <div className="spinner modal-spinner"></div> : <Send size={18} />}
                                <span className="hide-on-mobile">Enviar</span>
                            </button>
                            <button onClick={handleClose} className="btn-icon">
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="modal-body" ref={contentRef}>
                        {/* Información del Cliente */}
                        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Información del Cliente
                            </h3>
                            <div className="inventory-form-grid">
                                <div className="form-column">
                                    <div className="filter-group">
                                        <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cliente</span>
                                        <strong style={{ fontSize: '1.1rem' }}>{quotation.customerName}</strong>
                                    </div>
                                    <div className="filter-group">
                                        <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Teléfono</span>
                                        <strong style={{ fontSize: '1.1rem' }}>{quotation.phone}</strong>
                                    </div>
                                </div>
                                <div className="form-column">
                                    <div className="filter-group">
                                        <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fecha Registro</span>
                                        <strong style={{ fontSize: '1.1rem' }}>{formatDate(quotation.registrationDate || quotation.createdAt)}</strong>
                                    </div>
                                    <div className="filter-group">
                                        <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fecha Programada</span>
                                        <strong style={{ fontSize: '1.1rem' }}>{formatDate(quotation.scheduledDeliveryDate)}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Productos
                            </h3>

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
                                    <label className="input-label" style={{ fontWeight: '700', color: 'var(--success-color)' }}>ADELANTO (S/)</label>
                                    {isEditable ? (
                                        <input
                                            type="number"
                                            value={advancePayment}
                                            onChange={(e) => {
                                                setAdvancePayment(e.target.value);
                                                setHasChanges(true);
                                            }}
                                            className="input-field"
                                            min="0"
                                            step="0.01"
                                            style={{ borderColor: 'var(--success-color)', fontSize: '1.1rem', fontWeight: '700' }}
                                        />
                                    ) : (
                                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--success-color)' }}>
                                            S/ {parseFloat(advancePayment || 0).toFixed(2)}
                                        </div>
                                    )}
                                </div>
                                <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-muted)', flex: 1 }}>
                                    {isEditable ? 'El monto adelantado aplica para todo el pedido.' : 'Monto total adelantado por el cliente.'}
                                </div>
                            </div>

                            <div className="items-list grid-style">
                                {/* Header del grid para Desktop */}
                                <div className="item-row quotation hide-on-mobile" style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: 0, padding: '0.75rem 1rem', borderBottom: '2px solid var(--border-color)' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Cant.</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Descripción</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>P. Unit (S/)</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Total (S/)</div>
                                </div>

                                {items.map((item) => (
                                    <div key={item.id} className="quotation-item-detail-row">
                                        {/* ── Columna izquierda: imagen del item de inventario ── */}
                                        {item.inventoryItem && (
                                            <div className="quotation-item-image-col">
                                                <div className="quotation-item-image-box">
                                                    {item.inventoryItem.imageUrl ? (
                                                        <img
                                                            src={item.inventoryItem.imageUrl}
                                                            alt={item.inventoryItem.tipo || item.inventoryItem.itemNumber}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <ImageIcon size={28} strokeWidth={1.2} color="var(--text-muted)" />
                                                    )}
                                                </div>
                                                <div style={{
                                                    marginTop: '0.4rem',
                                                    padding: '0.2rem 0.4rem',
                                                    background: 'var(--primary-light)',
                                                    border: '1px solid var(--primary-color)',
                                                    borderRadius: '4px',
                                                    fontSize: '0.68rem',
                                                    color: 'var(--primary-color)',
                                                    fontWeight: '700',
                                                    textAlign: 'center'
                                                }}>
                                                    📦 {item.inventoryItem.itemNumber}
                                                </div>
                                            </div>
                                        )}

                                        {/* ── Columna derecha: datos del item ── */}
                                        <div className="quotation-item-data-col item-row quotation">
                                            <div className="filter-group">
                                                <label className="input-label hide-on-desktop">Cant.</label>
                                                {isEditable ? (
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                                        className="input-field"
                                                        min="1"
                                                        style={{ textAlign: 'center' }}
                                                    />
                                                ) : (
                                                    <div className="input-field" style={{ textAlign: 'center', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {item.quantity}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="filter-group">
                                                <label className="input-label hide-on-desktop">Descripción</label>
                                                <div className="input-field" style={{ background: 'var(--bg-tertiary)', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                                                    {item.product}
                                                </div>
                                            </div>
                                            <div className="filter-group">
                                                <label className="input-label hide-on-desktop">P. Unit. (S/)</label>
                                                {isEditable ? (
                                                    <input
                                                        type="number"
                                                        value={item.unitPrice}
                                                        onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                        className="input-field"
                                                        min="0"
                                                        step="0.01"
                                                        style={{ textAlign: 'right' }}
                                                    />
                                                ) : (
                                                    <div className="input-field" style={{ textAlign: 'right', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                        {item.unitPrice.toFixed(2)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="filter-group">
                                                <label className="input-label hide-on-desktop">Total (S/)</label>
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
                                                    {((item.quantity * item.unitPrice) + (item.shippingCost || 0)).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Totales */}
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
                                        TOTAL
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
                                        SALDO
                                    </p>
                                    <p style={{ margin: '0.2rem 0 0', fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-color)' }}>
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
