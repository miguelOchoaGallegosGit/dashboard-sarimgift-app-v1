import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);

        if (duration !== Infinity) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}>
                {toasts.map((toast) => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem = ({ toast, onClose }) => {
    const getStyles = () => {
        switch (toast.type) {
            case 'success':
                return {
                    bg: '#e8f5e9',
                    color: '#2e7d32',
                    border: '#a5d6a7',
                    icon: <CheckCircle size={18} />
                };
            case 'error':
                return {
                    bg: '#ffebee',
                    color: '#c62828',
                    border: '#ffcdd2',
                    icon: <XCircle size={18} />
                };
            case 'warning':
                return {
                    bg: '#fff3e0',
                    color: '#ef6c00',
                    border: '#ffe0b2',
                    icon: <AlertTriangle size={18} />
                };
            default:
                return {
                    bg: '#e3f2fd',
                    color: '#1976d2',
                    border: '#bbdefb',
                    icon: <Info size={18} />
                };
        }
    };

    const styles = getStyles();

    return (
        <div style={{
            backgroundColor: styles.bg,
            color: styles.color,
            border: `1px solid ${styles.border}`,
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '300px',
            animation: 'slideIn 0.3s ease-out',
            position: 'relative'
        }}>
            <div style={{ flexShrink: 0 }}>{styles.icon}</div>
            <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: '500' }}>{toast.message}</div>
            <button
                onClick={onClose}
                style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    color: styles.color,
                    opacity: 0.7,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <X size={16} />
            </button>

            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
