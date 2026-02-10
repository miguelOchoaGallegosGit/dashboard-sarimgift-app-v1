import React, { useState, useEffect } from 'react';
import { X, Package } from 'lucide-react';

export const AddInventoryItemModal = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        category: '',
        quantity: 0,
        unit_price: 0,
        tipo: '',
        material: '',
        modelo: '',
        diseno: '',
        size: '',
        color: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = ['Unisex', 'Niño', 'Niña', 'Dama', 'Caballero', 'Accesorios'];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Limpiar error del campo cuando el usuario empieza a escribir
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
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

    const validate = () => {
        const newErrors = {};

        if (!formData.category) {
            newErrors.category = 'La categoría es requerida';
        }

        const quantity = parseInt(formData.quantity);
        if (isNaN(quantity) || quantity < 0 || quantity > 1000) {
            newErrors.quantity = 'La cantidad debe estar entre 0 y 1000';
        }

        const unit_price = parseFloat(formData.unit_price);
        if (isNaN(unit_price) || unit_price < 0) {
            newErrors.unit_price = 'El precio debe ser mayor o igual a 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error saving item:', error);
            setErrors({ submit: error.message || 'Error al guardar el item' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content add-inventory-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--primary-light)' }}>
                            <Package size={24} color="var(--primary-color)" />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Agregar Item al Inventario</h2>
                    </div>
                    <button onClick={onClose} className="btn-icon" style={{ background: 'var(--bg-tertiary)' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.25rem' }}>
                    <div className="inventory-form-grid">
                        {/* Column 1 */}
                        <div className="form-column">
                            {/* Categoría */}
                            <div className="filter-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                    Categoría *
                                </label>
                                <select
                                    name="category"
                                    className="input-field"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Seleccionar...</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                {errors.category && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem' }}>{errors.category}</span>}
                            </div>

                            {/* Cantidad */}
                            <div className="filter-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                    Cantidad *
                                </label>
                                <input
                                    type="number"
                                    name="quantity"
                                    className="input-field"
                                    placeholder="0"
                                    min="0"
                                    max="1000"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.quantity && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem' }}>{errors.quantity}</span>}
                            </div>

                            {/* Tipo */}
                            <div className="filter-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                    Tipo
                                </label>
                                <input
                                    type="text"
                                    name="tipo"
                                    className="input-field"
                                    placeholder="Ej: TOMATODO, CUADRO, BOTI"
                                    value={formData.tipo}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Modelo */}
                            <div className="filter-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                    Modelo
                                </label>
                                <input
                                    type="text"
                                    name="modelo"
                                    className="input-field"
                                    placeholder="Ej: TAPA ROSCA, A4"
                                    value={formData.modelo}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Column 2 */}
                        <div className="form-column">
                            {/* Precio Unitario */}
                            <div className="filter-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                    Precio Unitario *
                                </label>
                                <input
                                    type="number"
                                    name="unit_price"
                                    className="input-field"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    value={formData.unit_price}
                                    onChange={handleChange}
                                    required
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    Precio de venta del producto
                                </span>
                                {errors.unit_price && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem' }}>{errors.unit_price}</span>}
                            </div>

                            {/* Material */}
                            <div className="filter-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                    Material
                                </label>
                                <input
                                    type="text"
                                    name="material"
                                    className="input-field"
                                    placeholder="Ej: METAL, PINTADO, MADERA"
                                    value={formData.material}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Diseño */}
                            <div className="filter-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                    Diseño
                                </label>
                                <input
                                    type="text"
                                    name="diseno"
                                    className="input-field"
                                    placeholder="Ej: NEGRO 650ML, AZUL 650ML"
                                    value={formData.diseno}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Talla */}
                            <div className="filter-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                    Talla
                                </label>
                                <input
                                    type="text"
                                    name="size"
                                    className="input-field"
                                    placeholder="Ej: S, M, L, XL"
                                    value={formData.size}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Color */}
                            <div className="filter-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                    Color
                                </label>
                                <input
                                    type="text"
                                    name="color"
                                    className="input-field"
                                    placeholder="Ej: Rojo, Azul, Negro"
                                    value={formData.color}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {errors.submit && (
                        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger-color)', borderRadius: '8px' }}>
                            <span style={{ color: 'var(--danger-color)', fontSize: '0.9rem' }}>{errors.submit}</span>
                        </div>
                    )}

                    {/* Botones */}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
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
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Item'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
