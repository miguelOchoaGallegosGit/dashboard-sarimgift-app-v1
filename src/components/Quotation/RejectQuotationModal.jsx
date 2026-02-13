import React, { useState } from 'react';
import { X, XCircle } from 'lucide-react';

export const RejectQuotationModal = ({ isOpen, onClose, onConfirm, quotationNumber }) => {
    const [rejectionReason, setRejectionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cerrar con ESC - DEBE estar antes del return condicional
    React.useEffect(() => {
        if (!isOpen) return;

        const handleEsc = (e) => {
            if (e.key === 'Escape' && !isSubmitting) {
                setRejectionReason('');
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, isSubmitting, onClose]);

    const handleSubmit = async () => {
        if (!rejectionReason.trim()) {
            alert('Por favor, ingresa el motivo del rechazo');
            return;
        }

        setIsSubmitting(true);
        try {
            await onConfirm(rejectionReason.trim());
            setRejectionReason('');
            onClose();
        } catch (error) {
            console.error('Error rejecting quotation:', error);
            alert('Error al rechazar la cotización: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setRejectionReason('');
            onClose();
        }
    };

    // Return condicional DESPUÉS de todos los hooks
    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay"
            onClick={handleClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 2000,
                backdropFilter: 'blur(8px)',
                animation: 'fadeIn 0.2s ease-out'
            }}
        >
            <div
                className="glass-panel"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '500px',
                    padding: '2rem',
                    position: 'relative',
                    animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '50%',
                        backgroundColor: '#ffebee',
                        color: '#c62828',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.25rem',
                        animation: 'pulse 2s ease-in-out infinite',
                        boxShadow: '0 4px 20px rgba(198, 40, 40, 0.25)'
                    }}>
                        <XCircle size={36} strokeWidth={2.5} />
                    </div>
                    <h3 style={{
                        fontSize: '1.35rem',
                        fontWeight: '700',
                        marginBottom: '0.5rem',
                        color: 'var(--text-color)',
                        lineHeight: '1.3'
                    }}>
                        Rechazar Cotización
                    </h3>
                    <p style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.95rem',
                        lineHeight: '1.5',
                        marginBottom: '0.25rem'
                    }}>
                        {quotationNumber}
                    </p>
                    <p style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.9rem',
                        lineHeight: '1.6'
                    }}>
                        Esta acción cambiará el estado a <strong style={{ color: '#c62828' }}>RECHAZADO</strong>
                    </p>
                </div>

                {/* Input de Motivo */}
                <div style={{ marginBottom: '2rem' }}>
                    <label
                        htmlFor="rejectionReason"
                        className="input-label"
                        style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: 'var(--text-color)'
                        }}
                    >
                        Motivo del Rechazo *
                    </label>
                    <textarea
                        id="rejectionReason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Ej: Cliente canceló el pedido, Producto no disponible, Precio no acordado..."
                        rows={4}
                        disabled={isSubmitting}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            fontSize: '0.95rem',
                            fontFamily: 'inherit',
                            border: '2px solid var(--border-color)',
                            borderRadius: '8px',
                            backgroundColor: 'var(--glass-bg)',
                            color: 'var(--text-color)',
                            resize: 'vertical',
                            minHeight: '100px',
                            transition: 'border-color 0.2s ease',
                            outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#c62828'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                    />
                    <p style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.5rem',
                        fontStyle: 'italic'
                    }}>
                        Este motivo quedará registrado en el historial
                    </p>
                </div>

                {/* Botones de Acción */}
                <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    justifyContent: 'center'
                }}>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="btn"
                        style={{
                            flex: 1,
                            padding: '0.75rem 1.5rem',
                            fontSize: '1rem',
                            fontWeight: '600',
                            backgroundColor: 'var(--glass-bg)',
                            color: 'var(--text-color)',
                            border: '2px solid var(--border-color)',
                            borderRadius: '8px',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            opacity: isSubmitting ? 0.5 : 1
                        }}
                        onMouseEnter={(e) => {
                            if (!isSubmitting) {
                                e.target.style.backgroundColor = 'var(--glass-border)';
                                e.target.style.transform = 'translateY(-1px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'var(--glass-bg)';
                            e.target.style.transform = 'translateY(0)';
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !rejectionReason.trim()}
                        className="btn"
                        style={{
                            flex: 1,
                            padding: '0.75rem 1.5rem',
                            fontSize: '1rem',
                            fontWeight: '600',
                            backgroundColor: '#c62828',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: (isSubmitting || !rejectionReason.trim()) ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 15px rgba(198, 40, 40, 0.25)',
                            opacity: (isSubmitting || !rejectionReason.trim()) ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                            if (!isSubmitting && rejectionReason.trim()) {
                                e.target.style.backgroundColor = '#b71c1c';
                                e.target.style.transform = 'translateY(-1px)';
                                e.target.style.boxShadow = '0 6px 20px rgba(198, 40, 40, 0.35)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#c62828';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 15px rgba(198, 40, 40, 0.25)';
                        }}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="spinner" style={{
                                    width: '16px',
                                    height: '16px',
                                    borderWidth: '2px'
                                }}></div>
                                Rechazando...
                            </>
                        ) : (
                            <>
                                <XCircle size={18} />
                                Rechazar Cotización
                            </>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes scaleIn {
                    from { 
                        opacity: 0;
                        transform: scale(0.9) translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
            `}</style>
        </div>
    );
};
