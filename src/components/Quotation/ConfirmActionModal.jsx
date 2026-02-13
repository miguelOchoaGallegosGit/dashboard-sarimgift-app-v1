import React from 'react';
import { X, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export const ConfirmActionModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Aceptar',
    cancelText = 'Cancelar',
    type = 'warning' // 'warning', 'danger', 'success', 'info'
}) => {
    if (!isOpen) return null;

    // Configuración de estilos según el tipo
    const typeConfig = {
        warning: {
            icon: AlertTriangle,
            bgColor: '#fff3e0',
            iconColor: '#ef6c00',
            buttonBg: '#ef6c00',
            buttonHover: '#e65100'
        },
        danger: {
            icon: XCircle,
            bgColor: '#ffebee',
            iconColor: '#c62828',
            buttonBg: '#c62828',
            buttonHover: '#b71c1c'
        },
        success: {
            icon: CheckCircle,
            bgColor: '#e8f5e9',
            iconColor: '#2e7d32',
            buttonBg: '#2e7d32',
            buttonHover: '#1b5e20'
        },
        info: {
            icon: Info,
            bgColor: '#e3f2fd',
            iconColor: '#1976d2',
            buttonBg: '#1976d2',
            buttonHover: '#1565c0'
        }
    };

    const config = typeConfig[type] || typeConfig.warning;
    const IconComponent = config.icon;

    // Cerrar con ESC
    React.useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div
            className="modal-overlay"
            onClick={onClose}
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
                    maxWidth: '450px',
                    padding: '2rem',
                    position: 'relative',
                    animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }}
            >
                {/* Icono y Título */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '50%',
                        backgroundColor: config.bgColor,
                        color: config.iconColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.25rem',
                        animation: 'pulse 2s ease-in-out infinite',
                        boxShadow: `0 4px 20px ${config.iconColor}40`
                    }}>
                        <IconComponent size={36} strokeWidth={2.5} />
                    </div>
                    <h3 style={{
                        fontSize: '1.35rem',
                        fontWeight: '700',
                        marginBottom: '0.75rem',
                        color: 'var(--text-color)',
                        lineHeight: '1.3'
                    }}>
                        {title}
                    </h3>
                    <p style={{
                        color: 'var(--text-muted)',
                        fontSize: '1rem',
                        lineHeight: '1.6',
                        margin: '0 auto',
                        maxWidth: '350px'
                    }}>
                        {message}
                    </p>
                </div>

                {/* Botones de Acción */}
                <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    justifyContent: 'center',
                    marginTop: '2rem'
                }}>
                    <button
                        onClick={onClose}
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
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            ':hover': {
                                backgroundColor: 'var(--glass-border)',
                                transform: 'translateY(-1px)'
                            }
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'var(--glass-border)';
                            e.target.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'var(--glass-bg)';
                            e.target.style.transform = 'translateY(0)';
                        }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="btn"
                        style={{
                            flex: 1,
                            padding: '0.75rem 1.5rem',
                            fontSize: '1rem',
                            fontWeight: '600',
                            backgroundColor: config.buttonBg,
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: `0 4px 15px ${config.buttonBg}40`
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = config.buttonHover;
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = `0 6px 20px ${config.buttonBg}60`;
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = config.buttonBg;
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = `0 4px 15px ${config.buttonBg}40`;
                        }}
                    >
                        {confirmText}
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
