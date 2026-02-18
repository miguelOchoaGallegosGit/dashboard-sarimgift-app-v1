import React from 'react';
import { AlertTriangle, Info, XCircle, CheckCircle } from 'lucide-react';

/**
 * AlertDialog - Modal de alerta profesional que reemplaza window.alert()
 *
 * Props:
 *   isOpen    {boolean}  - Controla visibilidad
 *   onClose   {fn}       - Callback al cerrar / aceptar
 *   title     {string}   - Título del diálogo (opcional)
 *   message   {string}   - Mensaje principal
 *   type      {string}   - 'warning' | 'error' | 'info' | 'success'  (default: 'warning')
 *   btnLabel  {string}   - Texto del botón (default: 'Entendido')
 */
export const AlertDialog = ({
    isOpen,
    onClose,
    title,
    message,
    type = 'warning',
    btnLabel = 'Entendido'
}) => {
    if (!isOpen) return null;

    const config = {
        warning: {
            Icon: AlertTriangle,
            iconColor: '#f59e0b',
            iconBg: 'rgba(245, 158, 11, 0.12)',
            btnClass: 'btn-alert-warning',
            defaultTitle: 'Atención'
        },
        error: {
            Icon: XCircle,
            iconColor: '#ef4444',
            iconBg: 'rgba(239, 68, 68, 0.12)',
            btnClass: 'btn-alert-error',
            defaultTitle: 'Error'
        },
        info: {
            Icon: Info,
            iconColor: '#3b82f6',
            iconBg: 'rgba(59, 130, 246, 0.12)',
            btnClass: 'btn-alert-info',
            defaultTitle: 'Información'
        },
        success: {
            Icon: CheckCircle,
            iconColor: '#10b981',
            iconBg: 'rgba(16, 185, 129, 0.12)',
            btnClass: 'btn-alert-success',
            defaultTitle: 'Éxito'
        }
    };

    const { Icon, iconColor, iconBg, btnClass, defaultTitle } = config[type] || config.warning;
    const displayTitle = title || defaultTitle;

    return (
        <div className="alert-dialog-overlay" onClick={onClose}>
            <div className="alert-dialog-box" onClick={(e) => e.stopPropagation()}>
                {/* Icono */}
                <div className="alert-dialog-icon-wrap" style={{ background: iconBg }}>
                    <Icon size={32} color={iconColor} strokeWidth={2} />
                </div>

                {/* Título */}
                <h3 className="alert-dialog-title">{displayTitle}</h3>

                {/* Mensaje */}
                <p className="alert-dialog-message">{message}</p>

                {/* Botón */}
                <button
                    className={`btn alert-dialog-btn ${btnClass}`}
                    onClick={onClose}
                    autoFocus
                >
                    {btnLabel}
                </button>
            </div>
        </div>
    );
};
