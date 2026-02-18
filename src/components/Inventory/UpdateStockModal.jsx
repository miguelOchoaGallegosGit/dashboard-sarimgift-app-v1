import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Edit3, Upload, Image as ImageIcon } from 'lucide-react';
import { InventoryService } from '../../services/InventoryService';

export const UpdateStockModal = ({ item, onClose, onUpdate }) => {
    const [newQuantity, setNewQuantity] = useState(item.quantity);
    const [newUnitPrice, setNewUnitPrice] = useState(item.unit_price || 0);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(item.imageUrl || null);
    const [originalImageUrl] = useState(item.imageUrl || null);

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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setError('La imagen no debe superar los 2MB');
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
            setError('');
        }
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
            let imageUrl = originalImageUrl;

            // Si hay un nuevo archivo, subirlo y borrar el anterior
            if (imageFile) {
                // Borrar imagen anterior si existía
                if (originalImageUrl) {
                    await InventoryService.deleteImage(originalImageUrl);
                }
                // Subir nueva imagen
                imageUrl = await InventoryService.uploadImage(imageFile);
            }

            await onUpdate(item.id, {
                quantity,
                unit_price,
                imageUrl
            });
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
            <div
                className="modal-content update-stock-modal"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--primary-light)' }}>
                            <Edit3 size={22} color="var(--primary-color)" />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.35rem' }}>Actualizar Stock y Costo</h2>
                    </div>
                    <button onClick={onClose} className="btn-icon" style={{ background: 'var(--bg-tertiary)' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.25rem' }}>
                    {/* Información del item */}
                    <div
                        className="glass-panel"
                        style={{
                            padding: '0.875rem 1rem',
                            marginBottom: '1.25rem',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <div style={{ marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {item.itemNumber}
                            </span>
                        </div>
                        <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem' }}>{item.name}</h3>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                            <span>Categoría: <strong style={{ color: 'var(--text-color)' }}>{item.category}</strong></span>
                            <span>Stock Actual: <strong style={{ color: item.quantity < 5 ? 'var(--danger-color)' : 'var(--success-color)' }}>{item.quantity}</strong></span>
                        </div>
                    </div>

                    {/* Layout de 2 columnas */}
                    <div className="update-stock-grid">

                        {/* ── Columna izquierda: Imagen ── */}
                        <div className="update-stock-image-col">
                            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem' }}>
                                Imagen del Producto
                            </label>

                            {/* Preview grande */}
                            <div className="update-stock-image-preview">
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Preview del producto"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        color: 'var(--text-muted)'
                                    }}>
                                        <ImageIcon size={48} strokeWidth={1.2} />
                                        <span style={{ fontSize: '0.8rem', textAlign: 'center' }}>Sin imagen</span>
                                    </div>
                                )}
                            </div>

                            {/* Botón cargar */}
                            <label className="btn btn-secondary update-stock-upload-btn">
                                <Upload size={15} />
                                {originalImageUrl || imageFile ? 'Cambiar Imagen' : 'Subir Imagen'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    style={{ display: 'none' }}
                                />
                            </label>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                Capacidad: Máx 2MB · JPG, PNG, WEBP
                            </p>

                            {/* Nombre del archivo seleccionado */}
                            {imageFile && (
                                <div style={{
                                    marginTop: '0.6rem',
                                    padding: '0.4rem 0.6rem',
                                    background: 'var(--success-bg)',
                                    border: '1px solid var(--success-border)',
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    color: 'var(--success-color)',
                                    textAlign: 'center',
                                    wordBreak: 'break-all'
                                }}>
                                    ✓ {imageFile.name}
                                </div>
                            )}
                        </div>

                        {/* ── Columna derecha: Datos ── */}
                        <div className="update-stock-data-col">

                            {/* Nueva Cantidad */}
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
                                    style={{ fontSize: '1.15rem', fontWeight: '600' }}
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Rango permitido: 0 – 1000 unidades
                                </span>
                            </div>

                            {/* Nuevo Precio */}
                            <div className="filter-group" style={{ marginTop: '1rem' }}>
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
                                    style={{ fontSize: '1.15rem', fontWeight: '600' }}
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Precio de venta del producto
                                </span>
                            </div>

                            {/* Error */}
                            {error && (
                                <div style={{
                                    marginTop: '0.75rem',
                                    padding: '0.6rem 0.8rem',
                                    background: 'var(--danger-bg)',
                                    border: '1px solid var(--danger-border)',
                                    borderRadius: '8px',
                                    color: 'var(--danger-color)',
                                    fontSize: '0.82rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem'
                                }}>
                                    <AlertTriangle size={14} />
                                    {error}
                                </div>
                            )}

                            {/* Advertencia stock bajo */}
                            {parseInt(newQuantity) > 0 && parseInt(newQuantity) < 5 && (
                                <div style={{
                                    padding: '0.65rem 0.875rem',
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    border: '1px solid var(--warning-color)',
                                    borderRadius: '8px',
                                    marginTop: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <AlertTriangle size={16} color="var(--warning-color)" />
                                    <span style={{ color: 'var(--warning-color)', fontSize: '0.82rem' }}>
                                        Stock bajo: Este item se marcará con alerta
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Botones de acción */}
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
