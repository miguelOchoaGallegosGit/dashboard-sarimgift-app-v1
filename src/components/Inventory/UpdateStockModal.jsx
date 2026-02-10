import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Edit3 } from 'lucide-react';

export const UpdateStockModal = ({ item, onClose, onUpdate }) => {
    const [newQuantity, setNewQuantity] = useState(item.quantity);
    const [newUnitPrice, setNewUnitPrice] = useState(item.unit_price || 0);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleQuantityChange = (e) => {
        const value = e.target.value;
        setNewQuantity(value);
        setError('');
    };

    const handleUnitPriceChange = (e) => {
        const value = e.target.value;
        setNewUnitPrice(value);
        setError('');
    };

    // Cerrar modal al presionar ESC
    useEffect(() => {
        const handleEscKey = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscKey);
        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [onClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const quantity = parseInt(newQuantity);
        const unit_price = parseFloat(newUnitPrice);

        // Validación
        if (isNaN(quantity) || quantity < 0 || quantity > 1000) {
            setError('La cantidad debe estar entre 0 y 1000');
            return;
        }

        if (isNaN(unit_price) || unit_price < 0) {
            setError('El precio debe ser mayor o igual a 0');
            return;
        }

        // Si es 0, mostrar confirmación
        if (quantity === 0 && !showConfirmation) {
            setShowConfirmation(true);
            return;
        }

        setIsSubmitting(true);
        try {
            await onUpdate(item.id, { quantity, unit_price });
            onClose();
        } catch (err) {
            console.error('Error updating item:', err);
            setError(err.message || 'Error al actualizar el item');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelConfirmation = () => {
        setShowConfirmation(false);
        setNewQuantity(item.quantity);
        setNewUnitPrice(item.unit_price || 0);
    };

    if (showConfirmation) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                    <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--danger-bg)' }}>
                                <AlertTriangle size={24} color="var(--danger-color)" />
                            </div>
                            <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Confirmar Stock en Cero</h2>
                        </div>
                    </div>

                    <div style={{ padding: '1.25rem' }}>
                        <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-color)', marginBottom: '1.5rem' }}>
                            ¿Estás seguro de establecer la cantidad en <strong style={{ color: 'var(--danger-color)' }}>0</strong>?
                            <br />
                            Esto indicará que el producto está <strong>agotado</strong>.
                        </p>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={handleCancelConfirmation}
                                className="btn btn-secondary"
                                style={{ flex: 1 }}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="btn"
                                style={{
                                    flex: 1,
                                    background: 'var(--danger-color)',
                                    color: 'white',
                                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                                }}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="spinner" />
                                        Actualizando...
                                    </>
                                ) : (
                                    'Sí, establecer en 0'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--primary-light)' }}>
                            <Edit3 size={24} color="var(--primary-color)" />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Actualizar Stock y Costo</h2>
                    </div>
                    <button onClick={onClose} className="btn-icon" style={{ background: 'var(--bg-tertiary)' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.25rem' }}>
                    {/* Información del item */}
                    <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {item.itemNumber}
                            </span>
                        </div>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>{item.name}</h3>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <span>Categoría: <strong style={{ color: 'var(--text-color)' }}>{item.category}</strong></span>
                            <span>Stock Actual: <strong style={{ color: item.quantity < 5 ? 'var(--danger-color)' : 'var(--success-color)' }}>{item.quantity}</strong></span>
                        </div>
                    </div>

                    {/* Campo de nueva cantidad */}
                    <div className="filter-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                            Nueva Cantidad
                        </label>
                        <input
                            type="number"
                            className="input-field"
                            placeholder="Ingrese la nueva cantidad"
                            min="0"
                            max="1000"
                            value={newQuantity}
                            onChange={handleQuantityChange}
                            required
                            autoFocus
                            style={{ fontSize: '1.2rem', fontWeight: '600' }}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            Rango permitido: 0 - 1000 unidades
                        </span>
                        {error && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{error}</span>}
                    </div>

                    {/* Campo de nuevo precio */}
                    <div className="filter-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                            Nuevo Precio Unitario
                        </label>
                        <input
                            type="number"
                            className="input-field"
                            placeholder="Ingrese el nuevo precio"
                            min="0"
                            step="0.01"
                            value={newUnitPrice}
                            onChange={handleUnitPriceChange}
                            required
                            style={{ fontSize: '1.2rem', fontWeight: '600' }}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            Precio de venta del producto
                        </span>
                    </div>

                    {/* Advertencia si el nuevo stock es bajo */}
                    {parseInt(newQuantity) > 0 && parseInt(newQuantity) < 5 && (
                        <div style={{
                            padding: '0.75rem 1rem',
                            background: 'rgba(245, 158, 11, 0.1)',
                            border: '1px solid var(--warning-color)',
                            borderRadius: '8px',
                            marginTop: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <AlertTriangle size={18} color="var(--warning-color)" />
                            <span style={{ color: 'var(--warning-color)', fontSize: '0.85rem' }}>
                                Stock bajo: Este item se marcará con alerta
                            </span>
                        </div>
                    )}

                    {/* Botones */}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary"
                            style={{ flex: 1 }}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="spinner" />
                                    Actualizando...
                                </>
                            ) : (
                                'Actualizar'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
