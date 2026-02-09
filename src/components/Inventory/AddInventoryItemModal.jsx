import React, { useState, useEffect } from 'react';
import { X, Package } from 'lucide-react';

export const AddInventoryItemModal = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        quantity: 0,
        tipo: '',
        material: '',
        modelo: '',
        diseno: '',
        notes: ''
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

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es requerido';
        }

        if (!formData.category) {
            newErrors.category = 'La categoría es requerida';
        }

        const quantity = parseInt(formData.quantity);
        if (isNaN(quantity) || quantity < 0 || quantity > 1000) {
            newErrors.quantity = 'La cantidad debe estar entre 0 y 1000';
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
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.2)' }}>
                            <Package size={24} color="var(--primary-color)" />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Agregar Item al Inventario</h2>
                    </div>
                    <button onClick={onClose} className="btn-icon" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Nombre */}
                        <div className="filter-group">
                            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                Nombre del Producto *
                            </label>
                            <input
                                type="text"
                                name="name"
                                className="input-field"
                                placeholder="Ej: Polo Básico"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                            {errors.name && <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem' }}>{errors.name}</span>}
                        </div>

                        {/* Descripción */}
                        <div className="filter-group">
                            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                Descripción
                            </label>
                            <textarea
                                name="description"
                                className="input-field"
                                placeholder="Descripción detallada del producto..."
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        {/* Categoría y Cantidad */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                        </div>

                        {/* Precio, Talla, Color */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="filter-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                    Tipo
                                </label>
                                <input
                                    type="text"
                                    name="tipo"
                                    className="input-field"
                                    placeholder="Ej: TOMATODO, CUADRO, BOTELLA"
                                    value={formData.tipo}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="filter-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                    Material
                                </label>
                                <input
                                    type="text"
                                    name="material"
                                    className="input-field"
                                    placeholder="Ej: METAL PINTADO, MADERA"
                                    value={formData.material}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Modelo y Diseño */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                        </div>

                        {/* Notas */}
                        <div className="filter-group">
                            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                Notas Adicionales
                            </label>
                            <textarea
                                name="notes"
                                className="input-field"
                                placeholder="Notas o comentarios adicionales..."
                                value={formData.notes}
                                onChange={handleChange}
                                rows={2}
                                style={{ resize: 'vertical' }}
                            />
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
                    </div>
                </form>
            </div>
        </div>
    );
};
